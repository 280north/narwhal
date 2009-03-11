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
    var f = new File(path, "r");
    try { return f.read.apply(f, Array.prototype.slice.call(arguments, 1)); } finally { f.close(); }
}

File.size = function(path) {
    var f = new File(path);
    try { return f.size(); } finally { f.close(); }
}

File.isReadable = function(path) {
    var f = new File(path);
    try { return f.isReadable(); } finally { f.close(); }
}

File.isWritable = function(path) {
    var f = new File(path);
    try { return f.isWritable(); } finally { f.close(); }
}

File.mtime = function(path) {
    var f = new File(path);
    try { return f.mtime(); } finally { f.close(); }
}

File.exists = function (path) {
    var f = new File(path);
    try { return f.exists(); } finally { f.close(); }
};

