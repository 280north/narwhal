var Utils = require("utils"),
    Mime = require("mime").Mime;

var Jack_File = exports.File = function(root) {
    return function(env) {
        var pathInfo = Utils.unescape(env["PATH_INFO"]);

        if (pathInfo.indexOf("..") >= 0)
            return Jack_File.forbidden();

        var path = pathInfo ? File.join(root, pathInfo) : root; // don't want to append a "/" if PATH_INFO is empty

        try {
            
            var contents = File.read(path);//readFile(path);
            if (contents)
                return Jack_File.serve(path, contents);
        } catch(e) {}

        return Jack_File.notFound(path);
    }
}

Jack_File.serve = function(path, contents) {
    var body = contents,
        size = contents.length;

    return [200, {    
        //"Last-Modified"  : File.mtime(path).httpdate(),
        "Content-Type"   : Mime.mimeType(File.extname(path), "text/plain"),
        "Content-Length" : String(size)
    }, body];
}

Jack_File.notFound = function(path) {
    var body = "File not found: "+path+"\n";
    
    return [404, {
        "Content-Type"   : "text/plain",
        "Content-Length" : String(body.length)
    }, body];
}

Jack_File.forbidden = function() {
    var body = "Forbidden\n";
    
    return [403, {
        "Content-Type"   : "text/plain",
        "Content-Length" : String(body.length)
    }, body];
}
