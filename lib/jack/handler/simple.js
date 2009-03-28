// handler for Simple (http://simpleweb.sourceforge.net/) based on the servlet handler
var HashP = require("hashp").HashP;

var Simple = exports.Simple = exports.Handler = function() {}

Simple.run = function(app, options) {
    var options = options || {};
    
    var handler = new Packages.org.simpleframework.http.core.Container({
        handle : function(request, response) {
            try {
                Simple.process(app, request, response);
            } catch (e) {
                print("ERROR: " + e);
                throw e;
            }
        }
    });
    
    // different version
    var port = options["port"] || 8080,
        address = new Packages.java.net.InetSocketAddress(port),
        connection;
        
    if (typeof Packages.org.simpleframework.transport.connect.SocketConnection === "function")
        connection = new Packages.org.simpleframework.transport.connect.SocketConnection(handler);
    else if (typeof Packages.org.simpleframework.http.connect.SocketConnection === "function")
        connection = new Packages.org.simpleframework.http.connect.SocketConnection(handler);
    else
        throw new Error("Simple SocketConnection not found, missing .jar?");
    
    print("Jack is starting up using Simple on port " + port);
    
    connection.connect(address);
}

Simple.process = function(app, request, response) {
    var env = {};
    
    // copy HTTP headers over, converting where appropriate
    for (var e = request.getNames().iterator(); e.hasNext();)
    {
        var name = String(e.next()),
            value = String(request.getValue(name)), // FIXME: only gets the first of multiple
            key = name.replace(/-/g, "_").toUpperCase();
        
        if (key != "CONTENT_LENGTH" && key != "CONTENT_TYPE")
            key = "HTTP_" + key;

        env[key] = value;
    }
    
    var address = request.getAddress();

    if (env["HTTP_HOST"])
    {
        var parts = env["HTTP_HOST"].split(":");
        if (parts.length === 2)
        {
            env["SERVER_NAME"] = parts[0];
            env["SERVER_PORT"] = parts[1];
        }
    }
    //else
    //{
    //    env["SERVER_NAME"] = String(address.getDomain() || "");
    //    env["SERVER_PORT"] = String(address.getPort() || "");
    //}
    
    env["SCRIPT_NAME"]          = "";
    env["PATH_INFO"]            = String(request.getTarget() || "");
    
    env["REQUEST_METHOD"]       = String(request.getMethod() || "");
    env["QUERY_STRING"]         = String(request.getQuery().toString());
    env["HTTP_VERSION"]         = "HTTP/"+request.getMajor()+"."+request.getMinor();
    
    var cAddr, addr;
    if (cAddr = request.getClientAddress())
        env["REMOTE_ADDR"]      = String(cAddr.getHostName() || cAddr.getAddress() || "");
    
    env["jack.version"]         = [0,1];
    env["jack.input"]           = new IO(request.getInputStream(), null);
    env["jack.errors"]          = STDERR;
    env["jack.multithread"]     = true;
    env["jack.multiprocess"]    = true;
    env["jack.run_once"]        = false;
    env["jack.url_scheme"]      = String(address.getScheme() || "http");
    
    // efficiently serve files if the server supports it
    env["HTTP_X_ALLOW_SENDFILE"] = "yes";
    
    // call the app
    var result = app(env),
        status = result[0], headers = result[1], body = result[2];
    
    // set the status
    response.setCode(status);
    
    // check to see if X-Sendfile was used, remove the header
    var sendfilePath = null;
    if (HashP.includes(headers, "X-Sendfile")) {
        sendfilePath = HashP.unset(headers, "X-Sendfile");
        HashP.set(headers, "Content-Length", String(File.size(sendfilePath)));
    }
    
    // set the headers
    for (var key in headers) {
        var value = headers[key];
        
        if (value.forEach) {
            var items = [];
            value.forEach(function(v) { items.push(v); });
            value = items.join(", ");
        }
        
        response.set(key, String(value));
    }
    
    // determine if the response should be chunked (FIXME: need a better way?)
    var chunked = HashP.includes(headers, "Transfer-Encoding") && HashP.get(headers, "Transfer-Encoding") !== 'identity';
    
    var output = new IO(null, response.getOutputStream());
    
    // X-Sendfile send
    if (sendfilePath) {
        var cIn  = new java.io.FileInputStream(sendfilePath).getChannel(),
            cOut = response.getByteChannel();
            
        cIn.transferTo(0, cIn.size(), cOut);
        
        cIn.close();
        cOut.close();
    }
    
    // output the body, flushing after each write if it's chunked
    body.forEach(function(chunk) {
        if (!sendfilePath) {
            //output.write(new java.lang.String(chunk).getBytes("US-ASCII"));
            //output.write(chunk, "US-ASCII");
            output.write(chunk);

            if (chunked)
                output.flush();
        }
    });
    
    output.close();
}
