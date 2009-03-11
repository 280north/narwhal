var Binary = exports.Binary = function(bytes) {
    this.bytes = bytes;
}

Binary.prototype.getLength = function() {
    return this.bytes.length;
}

Binary.prototype.toString = function(encoding) {
    return String(new java.lang.String(this.bytes, encoding || "UTF-8"));
}

String.prototype.toBinary = function(encoding) {
    return new Binary(new java.lang.String(this).getBytes(encoding || "UTF-8"));
}
