// File: platform independent

var File = exports.File = require("{platform}/file").File;

File.SEPARATOR = "/";

File.dirname = function(path) {
    var raw = String(path),
        match = raw.match(/^(.*)\/[^\/]+\/?$/);
    if (match && match[1])
        return match[1]
    else if (raw.charAt(0) == "/")
        return "/"
    else
        return "."
}

File.extname = function(path) {
    var index = path.lastIndexOf(".");
    return index < 0 ? "" : path.substring(index);
}

File.join = function() {
    return Array.prototype.join.apply(arguments, [File.SEPARATOR]);
}

File.canonicalize = function(path) {
    return path.replace(/[^\/]+\/\.\.\//g, "").replace(/([^\.])\.\//g, "$1").replace(/^\.\//g, "").replace(/\/\/+/g, "/");
}

File.read = function(path) {
    var f = new File(path, "r"),
        result = f.read();
    f.close();
    return result;
}

File.size = function(path) {
    var f = new File(path),
        result = f.size();
    f.close();
    return result;
}

File.isReadable = function(path) {
    var f = new File(path),
        result = f.isReadable();
    f.close();
    return result;
}

File.isWritable = function(path) {
    var f = new File(path),
        result = f.isWritable();
    f.close();
    return result;
}
