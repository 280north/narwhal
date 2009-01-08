Jack.Handler.FastCGI = function() {};

Jack.Handler.FastCGI.run = function(app, options) {
    var options = options || {};
    //java.lang.System.setProperties("FCGI_PORT", options["port"] || 8080);
    while (true)
    {
        var result = new FCGIInterface().FCGIaccept();
        print(result);
        if (result < 0)
            break;
        
        print(FCGIInterface);
        Jack.Handler.FastCGI.serve(FCGIInterface.request, app);
    }
}

Jack.Handler.FastCGI.serve = function(request, app) {
    //var env = {
    //    "jack.input" : request.input,
    //    "jack.errors" : request.err,
    //    
    //    "jack.multithread" : false,
    //    "jack.multiprocess" : true,
    //    "jack.run_once" : false,
    // };
}

importPackage(Packages.com.fastcgi);
