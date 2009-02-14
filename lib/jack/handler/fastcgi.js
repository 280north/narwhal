var FastCGI = exports; //.FastCGI = function() {};

FastCGI.run = function(app, options) {
    var options = options || {};
    //java.lang.System.setProperties("FCGI_PORT", options["port"] || 8080);
    while (true)
    {
        var result = new Packages.com.fastcgi.FCGIInterface().FCGIaccept()
        if (result < 0)
            break;
        
        FastCGI.serve(Packages.com.fastcgi.FCGIInterface.request, app);
    }
}

FastCGI.serve = function(request, app) {
    print("Serving FastCGI request (if it were implememted...)");
    //var env = {
    //    "jack.input" : request.input,
    //    "jack.errors" : request.err,
    //    
    //    "jack.multithread" : false,
    //    "jack.multiprocess" : true,
    //    "jack.run_once" : false,
    // };
}
