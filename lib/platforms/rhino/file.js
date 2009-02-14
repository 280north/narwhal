// File: Rhino

var IO = require("../../io").IO;

var File = exports.File = function(path, mode) {
    var mode = mode || "r";
    
    this.file = new java.io.File(path);
    
    if (mode.indexOf("+") >= 0 || mode.indexOf("r") >= 0)
        this.inputStream = new Packages.java.io.FileInputStream(this.file);
    
    if (mode.indexOf("a") >= 0)
        this.outputStream = new Packages.java.io.FileOutputStream(this.file, true); 
    else if (mode.indexOf("+") >= 0 || mode.indexOf("w") >= 0)
        this.outputStream = new Packages.java.io.FileOutputStream(this.file, false);
}

File.prototype = new IO();

File.prototype.size = function(path) {
    return this.file.length();
}

File.prototype.isReadable = function(path) {
    return this.file.canRead();
}

File.prototype.isWritable = function(path) {
    return this.file.canWrite();
}
