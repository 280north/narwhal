// IO: default

var IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
}

IO.prototype.read = function(length) {
    return this.inputStream(length);
}

IO.prototype.write = function(object) {
    this.outputStream(object);
}

IO.prototype.flush = function() {
}

IO.prototype.close = function() {
}
