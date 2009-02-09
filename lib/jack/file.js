require("../jack");

Jack.File = function(root) {
    return function(env) {
        var pathInfo = Jack.Utils.unescape(env["PATH_INFO"]);

        if (pathInfo.indexOf("..") >= 0)
            return Jack.File.forbidden();

        var path = File.join(root, pathInfo);

        try {
            var contents = readFile(path);
            if (contents)
                return Jack.File.serve(path, contents);
        } catch(e) {}

        return Jack.File.notFound(path);
    }
}

Jack.File.serve = function(path, contents) {
    var body = contents,
        size = contents.length;

    return [200, {    
        //"Last-Modified"  : File.mtime(path).httpdate(),
        "Content-Type"   : Jack.Mime.mimeType(File.extname(path), "text/plain"),
        "Content-Length" : String(size)
    }, body];
}

Jack.File.notFound = function(path) {
    var body = "File not found: "+path+"\n";
    
    return [404, {
        "Content-Type"   : "text/plain",
        "Content-Length" : String(body.length)
    }, body];
}

Jack.File.forbidden = function() {
    var body = "Forbidden\n";
    
    return [403, {
        "Content-Type"   : "text/plain",
        "Content-Length" : String(body.length)
    }, body];
}
