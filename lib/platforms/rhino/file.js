// File: Rhino

var IO = require("../../io").IO;

var File = exports.File = function(path, mode) {
    this.file = new java.io.File(path);
    
    if (mode) {
        if (mode.indexOf("+") >= 0 || mode.indexOf("r") >= 0)
            this.inputStream = new Packages.java.io.FileInputStream(this.file);

        if (mode.indexOf("a") >= 0)
            this.outputStream = new Packages.java.io.FileOutputStream(this.file, true); 
        else if (mode.indexOf("+") >= 0 || mode.indexOf("w") >= 0)
            this.outputStream = new Packages.java.io.FileOutputStream(this.file, false);
    }
}

File.prototype = new IO();

File.prototype.size = function() {
    return Number(this.file.length());
}

File.prototype.isReadable = function() {
    return Boolean(this.file.canRead());
}

File.prototype.isWritable = function() {
    return Boolean(this.file.canWrite());
}

File.prototype.mtime = function() {
    return new Date(this.file.lastModified());
}

File.prototype.exists = function () {
    return this.file.exists();
};

