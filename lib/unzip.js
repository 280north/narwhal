var ASSERT = require("test/assert");

var ByteString = require("binary").ByteString
 
exports.bytesToNumberLE = function(bytes) {
    var acc = 0;
    for (var i = 0; i < bytes.length; i++)
        acc += bytes.get(i) << (8*i);
    return acc;
}
 
exports.bytesToNumberBE = function(bytes) {
    var acc = 0;
    for (var i = 0; i < bytes.length; i++)
        acc = (acc << 8) + bytes.get(i);
    return acc;
}
 
exports.numberToBytesLE = function(number, length) {
    var bytes = [];
    for (var i = 0; i < length; i++)
        bytes[i] = (number >> (8*i)) & 0xFF;
    return new ByteString(bytes);
}
 
exports.numberToBytesBE = function(number, length) {
    var bytes = [];
    for (var i = 0; i < length; i++)
        bytes[length-i-1] = (number >> (8*i)) & 0xFF;
    return new ByteString(bytes);
}

var Zip = exports.Zip = function(data) {
    this._data = data;
    this._offset = 0;
}

Zip.prototype.seek = function(offset) {
    this._offset = offset;
}

Zip.prototype.read = function(length) {
    var bytes = this._data.slice(this._offset, this._offset+length);
    this._offset += length;
    return bytes;
}

Zip.prototype.readInteger = function(length, bigEndian) {
    if (bigEndian)
        return exports.bytesToNumberBE(this.read(length));
    else
        return exports.bytesToNumberLE(this.read(length));
}

Zip.prototype.readString = function(length, charset) {
    return this.read(length).decodeToString(charset || "UTF-8");
}

Zip.prototype.readLocalFileHeader = function() {
    var stream = this;
    var header = {};
    
    // local file header signature     4 bytes  (0x04034b50)
    header.signature = stream.readInteger(4);
    if (header.signature !== 0x04034b50)
        throw new Error("Local file signature invalid (expects 0x04034b50, actually " + header.signature +")");
    
    // version needed to read       2 bytes
    header.version = stream.readInteger(2);
    // general purpose bit flag        2 bytes
    header.flags = stream.readInteger(2);
    // compression method              2 bytes
    header.compression_method = stream.readInteger(2);
    // last mod file time              2 bytes
    header.last_mod_file_time = stream.readInteger(2);
    // last mod file date              2 bytes
    header.last_mod_file_date = stream.readInteger(2);
    // crc-32                          4 bytes
    header.crc_32 = stream.readInteger(4);
    // compressed size                 4 bytes
    header.compressed_size = stream.readInteger(4);
    // uncompressed size               4 bytes
    header.uncompressed_size = stream.readInteger(4);
    // file name length                2 bytes
    header.file_name_length = stream.readInteger(2);
    // extra field length              2 bytes
    header.extra_field_length = stream.readInteger(2);
    
    // file name (variable size)
    header.file_name = stream.readString(header.file_name_length);
    // extra field (variable size)
    header.extra_field = stream.read(header.extra_field_length);
    
    return header;
}

Zip.prototype.readDataDescriptor = function() {
    var stream = this;
    var descriptor = {};
    
    // crc-32                          4 bytes
    descriptor.crc_32 = stream.readInteger(4);
    // compressed size                 4 bytes
    descriptor.compressed_size = stream.readInteger(4);
    // uncompressed size               4 bytes
    descriptor.uncompressed_size = stream.readInteger(4);
    
    return descriptor;
}
