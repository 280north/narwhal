
var util = require('./util');

/*** polynomials
*/
exports.polynomials = {
    'ieee802_3': 0xEDB88320,
    'castagnoli': 0x82F63B78,
    'kooperman': 0xEB31D82E
};

/*** Table
*/
exports.Table = function (polynomial) {
    var term, table = [];
    for (var i = 0; i < 256; i++) {
        term = i;
        for (var j = 0; j < 8; j++) {
            if (term & 1)
                term = (term >>> 1) ^ polynomial;
            else
                term = term >>> 1;
        }
        table[i] = term;
    }
    return table;
};

/*** table
*/
exports.table = exports.Table(exports.polynomials.ieee802_3);

/*** hash
    returns the crc32 hash for a string as an integer.
*/
exports.hash = function (bin, table) {
    if (util.no(table))
        table = exports.table;
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bin.length; i ++) {
        var x = bin.charCodeAt(i);
        if (x & ~0xFF)
            throw new Error(
                "crc32 can only encode strings of bytes.  " +
                "Consider using utf8.js#encode."
            );
        crc = (crc >>> 8) ^ table[x ^ (crc & 0xFF)];
    }
    return ~crc;
};

/*

    References
    ==========

    http://www.webtoolkit.info/
    Javascript crc32

*/
