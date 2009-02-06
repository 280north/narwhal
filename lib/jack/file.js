var Utils = require("utils");

var File = exports.File = function(root) {
    this.root = root;
}

File.prototype.invoke = function(env) {
    var path_info = Utils.unescape(env["PATH_INFO"]);
    
    if (path_info.indexOf("..") >= 0)
        return this.forbidden();
    
    this.path_info = path_info;
    this.path = File.join(this.root, this.path_info);
    
    try {
        var contents = readFile(this.path);
        if (contents)
            return this.serving(contents);
        else
            throw new Error();
    } catch(e) {}
    
    return this.not_found();
}

File.prototype.serving = function(contents) {
    var body = contents,
        size = contents.length;

    return [200, {    
        //"Last-Modified"  : File.mtime(this.path).httpdate(),
        //"Content-Type"   : Mime.mime_type(File.extname(this.path), "text/plain"),
        "Content-Type"   : "text/plain",
        "Content-Length" : String(size)
    }, body];
}

File.prototype.not_found = function() {
    var body = "File not found: "+this.path_info+"\n";
    return [404, {"Content-Type":"text/plain","Content-Length":String(body.length)}, [body]];
}

File.prototype.forbidden = function() {
    var body = "Forbidden";
    return [403, {"Content-Type":"text/plain", "Content-Length":String(body.length)}, [body]];
}
