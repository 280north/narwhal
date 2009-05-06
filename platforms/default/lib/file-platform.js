// File: default

var IO = require("./io").IO;

var File = exports.File = function(path) {
    this.path = path;
}
File.prototype = new IO();

File.prototype.read = function() {
    var result = narwhalReadFile(this.path);
    if (!result)
        throw new Error("Couldn't read file " + path);
    return result;
}

exports.SEPARATOR = '/';

exports.canonical = function(path) {
    var original;

    do {
        original = path;
        path = path
            .replace(/[^\/]+\/\.\.\//g, "")
            .replace(/([^\.])\.\//g, "$1")
            .replace(/^\.\//g, "")
            .replace(/\/\/+/g, "/");
    } while (path !== original);
        
    return path;
}
