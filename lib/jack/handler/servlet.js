// Similar in structure to Rack's Mongrel handler.
// All generic Java servlet code should go in here.
// Specific server code should go in separate handlers (i.e. jetty.js, etc)

var IO = require("io").IO;

var Servlet = exports.Servlet = function(app) {
    this.app = app;
}

Servlet.prototype.process = function(request, response) {
    var env = {};
    
    // copy HTTP headers over, converting where appropriate
    for (var e = request.getHeaderNames(); e.hasMoreElements();)
    {
        var name = String(e.nextElement()),
            value = String(request.getHeader(name)), // FIXME: only gets the first of multiple
            key = name.replace("-", "_").toUpperCase();
        
        if (key != "CONTENT_LENGTH" && key != "CONTENT_TYPE")
            key = "HTTP_" + key;
        
        env[key] = value;
    }
    
    env["SCRIPT_NAME"]          = String(request.getServletPath() || "");
    env["PATH_INFO"]            = String(request.getPathInfo() || "");
    
    env["REQUEST_METHOD"]       = String(request.getMethod() || "");
    env["SERVER_NAME"]          = String(request.getServerName() || "");
    env["SERVER_PORT"]          = String(request.getServerPort() || "");
    env["QUERY_STRING"]         = String(request.getQueryString() || "");
    env["HTTP_VERSION"]         = String(request.getProtocol() || "");
    
    env["jack.version"]         = [0,1];
    env["jack.input"]           = new IO(request.getInputStream(), null);
    env["jack.errors"]          = STDERR;
    env["jack.multithread"]     = true;
    env["jack.multiprocess"]    = true;
    env["jack.run_once"]        = false;
    env["jack.url_scheme"]      = request.isSecure() ? "https" : "http";
    
    // efficiently serve files if the server supports it
    env["HTTP_X_ALLOW_SENDFILE"] = "yes";
    
    // call the app
    var result = this.app(env),
        status = result[0], headers = result[1], body = result[2];
    
    // set the status
    response.setStatus(status);
    
    // check to see if X-Sendfile was used, remove the header
    var sendFilePath = null;
    if (HashP.includes(headers, "X-Sendfile"))
        sendFilePath = HashP.unset(headers, "X-Sendfile");
    
    // set the headers
    for (var key in headers) {
        var value = headers[key];
        
        if (value.forEach) {
            var items = [];
            value.forEach(function(v) { items.push(v); });
            value = items.join(", ");
        }
        
        response.setHeader(key, String(value));
    }

    // determine if the response should be chunked (FIXME: need a better way?)
    var chunked = HashP.includes(headers, "Transfer-Encoding") && HashP.get(headers, "Transfer-Encoding") !== 'identity';
    
    var output = response.getOutputStream();

    // X-Sendfile send
    if (sendFilePath) {
        var cIn  = new java.io.FileInputStream(sendFilePath).getChannel(),
            cOut = java.nio.channels.Channels.newChannel(output);

        cIn.transferTo(0, cIn.size(), cOut);

        cIn.close();
        cOut.close();
    }
    
    // output the body, flushing after each write if it's chunked
    body.forEach(function(chunk) {
        if (!sendFilePath) {
            //output.write(new java.lang.String(chunk).getBytes("US-ASCII"));
            output.print(chunk);

            if (chunked)
                response.flushBuffer(); //output.flush();
        }
    });

    output.close();
}
