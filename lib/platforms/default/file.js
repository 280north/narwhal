// File: default

var IO = require("../../IO").IO;

var File = exports.File = function(path) {
    this.path = path;
}
File.prototype = new IO();

File.prototype.read = function() {
    var result = readFile(this.path);
    if (!result)
        throw new Error("Couldn't read file " + path);
    return result;
}
