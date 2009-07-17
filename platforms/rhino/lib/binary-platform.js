exports.B_LENGTH = function(bytes) {
    return bytes.length;
}

exports.B_ALLOC = function(length) {
    return java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, length);
}

exports.B_FILL = function(bytes, length, offset, value) {
    java.util.Arrays.fill(bytes, length, offset, value);
}

exports.B_COPY = function(src, srcOffset, dst, dstOffset, length) {
    java.lang.System.arraycopy(src, srcOffset, dst, dstOffset, length);
}

exports.B_GET = function(bytes, index) {
    var b = bytes[index];
    return (b >= 0) ? b : -1 * ((b ^ 0xFF) + 1);
}   

exports.B_SET = function(bytes, index, value) {
    return bytes[index] = (value < 128) ? value : -1 * ((value ^ 0xFF) + 1);
}

exports.B_DECODE = function(bytes, offset, length, codec) {
    return String(new java.lang.String(bytes, offset, length, codec));
}

exports.B_DECODE_DEFAULT = function(bytes, offset, length) {
    return String(new java.lang.String(bytes, offset, length));
}

exports.B_ENCODE = function(string, codec) {
    return new java.lang.String(string).getBytes(codec);
}

exports.B_ENCODE_DEFAULT = function(string) {
    return new java.lang.String(string).getBytes();
}

exports.B_TRANSCODE = function(bytes, offset, length, sourceCodec, targetCodec) {
    return new java.lang.String(bytes, offset, length, sourceCodec).getBytes(targetCodec);
}
