// File: Rhino

var IO = require("../../IO").IO;

var File = exports.File = function(path, mode) {
    var mode = mode || "r";
    
    if (mode.indexOf("+") >= 0 || mode.indexOf("r") >= 0)
        this.inputStream = new Packages.java.io.FileInputStream(path);
    
    if (mode.indexOf("a") >= 0)
        this.outputStream = new Packages.java.io.FileOutputStream(path, true); 
    else if (mode.indexOf("+") >= 0 || mode.indexOf("w") >= 0)
        this.outputStream = new Packages.java.io.FileOutputStream(path, false);
}
File.prototype = new IO();

File.size = function(path) {
    return new Packages.java.io.File(path).length();
}

File.isReadable = function(path) {
    return new Packages.java.io.File(path).canRead();
}

File.isWritable = function(path) {
    return new Packages.java.io.File(path).canWrite();
}
