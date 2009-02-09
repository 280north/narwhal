require("../jack");

Jack.Static = function(app, options) {
    var options = options || {},
        urls = options["urls"] || ["/favicon.ico"],
        root = options["root"] || Dir.pwd(),
        fileServer = Jack.File(root);
    
    return function(env) {
        var path = env["PATH_INFO"];

        for (var i = 0; i < urls.length; i++)
            if (path.indexOf(urls[i]) === 0)
                return fileServer(env);
        
        return app(env);
    }
}
