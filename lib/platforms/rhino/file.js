// File: Rhino

var IO = require("../../IO").IO;

var File = exports.File = function(path) {
    this.inputStream = new Packages.java.io.FileInputStream(path);
}
File.prototype = new IO();
