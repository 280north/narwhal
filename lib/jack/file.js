Jack.File = function(root) {
    this.root = root;
}

Jack.File.prototype.call = function(env) {
    var path_info = Jack.Utils.unescape(env["PATH_INFO"]);
    
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

Jack.File.prototype.serving = function(contents) {
    var body = contents,
        size = contents.length;

    return [200, new Hash({    
        //"Last-Modified"  : File.mtime(this.path).httpdate(),
        //"Content-Type"   : Jack.Mime.mime_type(File.extname(this.path), "text/plain"),
        "Content-Type"   : "text/plain",
        "Content-Length" : String(size)
    }), body];
}

Jack.File.prototype.not_found = function() {
    var body = "File not found: "+this.path_info+"\n";
    return [404, new Hash({"Content-Type":"text/plain","Content-Length":String(body.length)}), [body]];
}

Jack.File.prototype.forbidden = function() {
    var body = "Forbidden";
    return [403, new Hash({"Content-Type":"text/plain", "Content-Length":String(body.length)}), [body]];
}

//Jack.File.prototype.each = function() {}