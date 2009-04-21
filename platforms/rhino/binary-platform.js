
var Binary = exports.Binary = function(bytes) {
    if (bytes instanceof Array) {
        var cast = Packages.java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, bytes.length);
        for (var i = 0; i < bytes.length; i++) {
            cast[i] = bytes[i] & 0xFF;
        }
        bytes = cast;
    }
    this.bytes = bytes;
};

Binary.prototype.getLength = function() {
    return this.bytes.length;
};

Binary.prototype.charAt = function (i) {
    return String.fromCharCode(this.bytes[i]);
};

Binary.prototype.byteAt = function (i) {
    return String.fromCharCode(this.bytes[i]);
};

Binary.prototype.charCodeAt = function (i) {
    return Number(this.bytes[i]);
};

Binary.prototype.toString = function(encoding) {
    var jstr = encoding ?
               new java.lang.String(this.bytes, encoding) :
               new java.lang.String(this.bytes);
    return String(jstr);
};

String.prototype.toBinary = function(encoding) {
    var bytes = encoding ?
                new java.lang.String(this).getBytes(encoding) :
                new java.lang.String(this).getBytes();
    return new Binary(bytes);
};
