exports.B_LENGTH = function(bytes) {
    return bytes.length;
}

exports.B_ALLOC = function(length) {
    var bytes = new Array(length);
    for (var i = 0; i < length; i++)
        bytes[i] = 0;
    return bytes;
}

exports.B_FILL = function(bytes, from, to, value) {
    for (var i = from; i < to; i++)
        bytes[i] = value;
}

exports.B_COPY = function(src, srcOffset, dst, dstOffset, length) {
    for (var i = 0; i < length; i++)
        dst[dstOffset+i] = src[srcOffset+i];
}

exports.B_GET = function(bytes, index) {
    return bytes[index];
}   

exports.B_SET = function(bytes, index, value) {
    return bytes[index] = value;
}

exports.B_DECODE = function(bytes, offset, length, codec) {
    throw "NYI";
}

exports.B_DECODE_DEFAULT = function(bytes, offset, length) {
    throw "NYI";
}

exports.B_ENCODE = function(string, codec) {
    throw "NYI";
}

exports.B_ENCODE_DEFAULT = function(string) {
    throw "NYI";
}

exports.B_TRANSCODE = function(bytes, offset, length, sourceCodec, targetCodec) {
    throw "NYI";
}
