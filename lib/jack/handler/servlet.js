require("../handler");

// Similar in structure to Rack's Mongrel handler.
// All generic Java servlet code should go in here.
// Specific server code should go in separate handlers (i.e. jetty.js, etc)

Jack.Handler.Servlet = function(app) {
    this.app = app;
}

Jack.Handler.Servlet.prototype.process = function(request, response) {
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
    env["jack.input"]           = null; // FIXME
    env["jack.errors"]          = STDERR;
    env["jack.multithread"]     = true;
    env["jack.multiprocess"]    = true;
    env["jack.run_once"]        = false;
    env["jack.url_scheme"]      = request.isSecure() ? "https" : "http";
    
    // call the app
    var result = this.app.invoke(env),
        status = result[0], headers = result[1], body = result[2];
    
    // set the status
    response.setStatus(status);
    
    // set the headers
    for (var key in headers) {
        var value = headers[key];
        
        if (value.each) {
            var items = [];
            value.each(function(v) { items.push(v); });
            value = items.join(", ");
        }
        
        response.setHeader(key, String(value));
    }
    
    // output the body, flushing after each write if it's chunked
    var output = response.getOutputStream(),
        chunked_response = HashP.includes(headers, "Transfer-Encoding") && HashP.get(headers, "Transfer-Encoding") !== 'identity';
    
    body.each(function(string) {
        output.print(string);
        
        if (chunked_response)
            response.flushBuffer();
    });
}
