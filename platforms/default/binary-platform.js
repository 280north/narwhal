var Binary = exports.Binary = function(string) {
    this.string = string;
}

Binary.prototype.getLength = function() {
    return this.string.length;
}

Binary.prototype.toString = function(encoding) {
    return this.string;
}

String.prototype.toBinary = function(encoding) {
    return new Binary(this);
}
