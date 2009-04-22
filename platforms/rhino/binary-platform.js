
var Binary = exports.Binary = function(bytes) {
    // FIXME: a Java byte array is also an Array. Find a better way to distinguish them.
    if (bytes instanceof Array && !bytes.toString().match(/^\[B@/)) {
        var cast = Packages.java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, bytes.length);
        for (var i = 0; i < bytes.length; i++) {
            // Java "bytes" are 2's complement
            var b = bytes[i] & 0xFF;
            cast[i] = (b < 128) ? b : -1 * ((b ^ 0xFF) + 1);
        }
        bytes = cast;
    }
    this.bytes = bytes;
}

Binary.prototype.getLength = function() {
    return this.bytes.length;
}

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
    return String(new java.lang.String(this.bytes, encoding || "UTF-8"));
}

String.prototype.toBinary = function(encoding) {
    return new Binary(new java.lang.String(this).getBytes(encoding || "UTF-8"));
}
