var V8CGI = exports; // .V8CGI = {};

V8CGI.run = function(app, request, response) {
    var env = {};
    
    // copy CGI variables
    for (var key in request._headers)
        env[key] = request._headers[key];

    env["HTTP_VERSION"]         = env["SERVER_PROTOCOL"];
    
    env["jack.version"]         = [0,1];
    env["jack.input"]           = null; // FIXME
    env["jack.errors"]          = STDERR;
    env["jack.multithread"]     = false;
    env["jack.multiprocess"]    = true;
    env["jack.run_once"]        = true;
    env["jack.url_scheme"]      = "http"; // FIXME
    
    // call the app
    var result = app(env),
        status = result[0], headers = result[1], body = result[2];
    
    // set the status
    response.status(status);
    
    // set the headers
    response.header(headers);
    
    // output the body
    body.forEach(function(string) {
        response.write(string);
    });
}
