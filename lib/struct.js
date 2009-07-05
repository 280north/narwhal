
var util = require("util");
var binary = require("binary");

/*** alphabet16Upper
*/
exports.alphabet16Upper = "0123456789ABCDEF";

/*** alphabet16Lower
*/
exports.alphabet16Lower = "0123456789abcdef";

/*** alphabet16
    ``alphabet16Lower`` is the default hexadecimal alphabet.
    This value can be overridden on the module
    and function level.
*/

exports.alphabet16 = exports.alphabet16Lower;

/*** alphabet36
*/
exports.alphabet36 = "0123456789abcdefghijklmnopqrstuvwxyz";

/*** alphabet64
*/
exports.alphabet64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/*** padBase64 
    base-64 pad character. "=" for strict RFC compliance, "" for brevity
    "=" by default.
    This value can be overridden on the module
    and function level.
*/
exports.padBase64 = "=";

/*** characterSize
    bits per input character. 8 - ASCII; 16 - Unicode
    This value can be overridden on the module
    and function level.
*/
exports.characterSize = 8; 

/*** ord
    Returns the character code ordinal (offset in the ASCII or Unicode tables)
    for a given single character. 

     - inverse: `chr`

*/
exports.ord = function (chr) {
    return chr.charCodeAt();
};

/*** chr
    Returns the character for a given character code ordinal (offset in the
    ASCII or Unicode tables).

     - inverse: `ord`

*/
exports.chr = function (ord) {
    return String.fromCharCode(ord);
};

/* undocumented addU32
    Add integers, wrapping at 2**32. This uses 16-bit operations internally
    to work around bugs in some JavaScript interpreters.

    - `variadic`
*/
exports.addU32 = function (/* ... */) {
    var acc = 0;
    for (var i = 0; i < arguments.length; i++) {
        var x = arguments[i];
        var lsw = (acc & 0xFFFF) + (x & 0xFFFF);
        var msw = (acc >> 16) + (x >> 16) + (lsw >> 16);
        acc = (msw << 16) | (lsw & 0xFFFF);
    }
    return acc;
};

/* undocumented rolU32
    Bitwise rotate a 32-bit number to the left.
*/
exports.rolU32 = function (num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
};

/* undocumented str2binl
    Convert a string to an array of little-endian words
    If characterSize is ASCII, characters >255 have their hi-byte silently ignored.
*/
exports.str2binl = function (str, _characterSize) {
    if (util.no(_characterSize))
        _characterSize = exports.characterSize;
    var bin = [];
    var mask = (1 << _characterSize) - 1;
    for (var i = 0; i < str.length * _characterSize; i += _characterSize)
        bin[i>>5] |= (str.charCodeAt(i / _characterSize) & mask) << (i % 32);
    return bin;
};

/* undocumented str2binb
    Convert an 8-bit or 16-bit string to an array of big-endian words
    In 8-bit function, characters >255 have their hi-byte silently ignored.
*/
exports.str2binb = function (str, _characterSize) {
    if (util.no(_characterSize))
        _characterSize = exports.characterSize;
    var bin = [];
    var mask = (1 << _characterSize) - 1;
    for (var i = 0; i < str.length * _characterSize; i += _characterSize)
        bin[i>>5] |= (
            (str.charCodeAt(i / _characterSize) & mask) <<
            (32 - _characterSize - i % 32)
        );
    return bin;
};

/* undocumented binl2str
    Convert an array of little-endian words to a string
*/
exports.binl2str = function (bin, _characterSize) {
    return exports.binl2bin(bin, _characterSize).decodeToString('ascii');
};

/* undocumented binl2bin
    Convert an array of little-endian words to a string
*/
exports.binl2bin = function (bin, _characterSize) {
    if (util.no(_characterSize)) 
        _characterSize = exports.characterSize;
    var str = [];
    var mask = (1 << _characterSize) - 1;
    for (var i = 0; i < bin.length * 32; i += _characterSize)
        str.push((bin[i>>5] >>> (i % 32)) & mask);
    return binary.ByteString(str);
};

/* undocumented binb2str
    Convert an array of big-endian words to a string
*/
exports.binb2str = function (bin, _characterSize) {
    return exports.binb2bin(bin, _characterSize).decodeToString('ascii');
};

/* undocumented binb2bin
    Convert an array of big-endian words to a string
*/
exports.binb2bin = function (bin, _characterSize) {
    if (util.no(_characterSize)) 
        _characterSize = exports.characterSize;
    var str = [];
    var mask = (1 << _characterSize) - 1;
    for (var i = 0; i < bin.length * 32; i += _characterSize)
        str.push((bin[i>>5] >>> (32 - _characterSize - i % 32)) & mask);
    return binary.ByteString(str);
};

/* undocumented binl2hex
    Convert an array of little-endian words to a hex string.
*/
exports.binl2hex = function (binarray, _alphabet16) {
    if (util.no(_alphabet16))
        _alphabet16 = exports.alphabet16;
    var str = "";
    for (var i = 0; i < binarray.length * 4; i++) {
        str += _alphabet16.charAt((binarray[i>>2] >> ((i % 4) * 8 + 4)) & 0xF) +
               _alphabet16.charAt((binarray[i>>2] >> ((i % 4) * 8)) & 0xF);
    }
    return str;
};

/* undocumented binb2hex
    Convert an array of big-endian words to a hex string.
*/
exports.binb2hex = function (binarray, _alphabet16) {
    if (util.no(_alphabet16))
        _alphabet16 = exports.alphabet16;
    var str = "";
    for (var i = 0; i < binarray.length * 4; i++) {
        str += _alphabet16.charAt((binarray[i>>2] >> ((3 - i % 4)*8+4)) & 0xF) +
               _alphabet16.charAt((binarray[i>>2] >> ((3 - i % 4) * 8)) & 0xF);
    }
    return str;
};

/* undocumented binl2base64
    Convert an array of little-endian words to a base-64 string
*/
exports.binl2base64 = function (binarray) {
    var str = "";
    for (var i = 0; i < binarray.length * 4; i += 3) {
        var triplet = (
            (((binarray[i >> 2] >> 8 * (i % 4)) & 0xFF) << 16) |
            (((binarray[i+1 >> 2] >> 8 * ((i+1)%4)) & 0xFF) << 8) |
            ((binarray[i+2 >> 2] >> 8 * ((i+2)%4)) & 0xFF)
        );
        for (var j = 0; j < 4; j++) {
            if (i * 8 + j * 6 > binarray.length * 32)
                str += exports.padBase64;
            else str += exports.alphabet64.charAt((triplet >> 6*(3-j)) & 0x3F);
        }
    }
    return str;
};

/* undocumented binb2base64
    Convert an array of big-endian words to a base-64 string
*/
exports.binb2base64 = function (binarray) {
    var str = "";
    for (var i = 0; i < binarray.length * 4; i += 3) {
        var triplet = (
            (((binarray[i >> 2] >> 8 * (3 - i % 4)) & 0xFF) << 16) |
            (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 ) |
            ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF)
        );
        for (var j = 0; j < 4; j++) {
            if (i * 8 + j * 6 > binarray.length * 32)
                str += exports.padBase64;
            else str += exports.alphabet64.charAt((triplet >> 6*(3-j)) & 0x3F);
        }
    }
    return str;
};

