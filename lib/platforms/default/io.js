// IO: default

var IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
}

IO.prototype.read = function(length) {
    return this.inputStream.read();
}

IO.prototype.write = function(object) {
    this.outputStream.write(object);
}

IO.prototype.flush = function() {
}

IO.prototype.close = function() {
}
