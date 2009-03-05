/*file chiron src/crypt/md4.js */

/*

    Version 2.1 Copyright (C) Jerrad Pierce, Paul Johnston 1999 - 2002.
    Distributed under the BSD License

    Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
    See http://pajhome.org.uk/crypt/md5 for more info.

*/

/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

/**

    A JavaScript implementation of the RSA Data Security, Inc. MD4 Message
    Digest Algorithm, as defined in RFC 1320.

*/

var base = require('./base');
var struct = require('./struct');

/*** hash
    returns a hexadecimal string of the md4 hash for a given byte string
*/
exports.hash = function (s) {
    return exports.hex_md4(s);
};

/* undocumented hex_md4
*/
exports.hex_md4 = function (s, _characterSize) {
    if (base.no(_characterSize))
        _characterSize = struct.characterSize;
    return struct.binl2hex(core_md4(struct.str2binl(s), s.length * _characterSize));
};

/* undocumented base64_md4
*/
exports.base64_md4 = function (s, _characterSize){
    if (base.no(_characterSize))
        _characterSize = struct.characterSize;
    return struct.binl2base64(core_md4(struct.str2binl(s), s.length * _characterSize));
};

/* undocumented str_md4
*/
exports.str_md4 = function (s, _characterSize){
    if (base.no(_characterSize))
        _characterSize = struct.characterSize;
    return struct.binl2str(core_md4(struct.str2binl(s), s.length * _characterSize));
};

/* undocumented hex_hamc_md4
*/
exports.hex_hmac_md4 = function (key, data) {
    return struct.binl2hex(core_hmac_md4(key, data));
};

/* undocumented base64_hmac_md4
*/
exports.base64_hmac_md4 = function (key, data) {
    return struct.binl2base64(core_hmac_md4(key, data));
};

/* undocumented str64_hmac_md4
*/
exports.str_hmac_md4 = function (key, data) {
    return struct.binl2str(core_hmac_md4(key, data));
};

/*
    Calculate the MD4 of an array of little-endian words, and a bit length
*/
var core_md4 = function (x, len) {
    /* append padding */
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    
    var a =  1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d =  271733878;

    for(var i = 0; i < x.length; i += 16) {
        var olda = a;
        var oldb = b;
        var oldc = c;
        var oldd = d;

        a = md4_ff(a, b, c, d, x[i+ 0], 3 );
        d = md4_ff(d, a, b, c, x[i+ 1], 7 );
        c = md4_ff(c, d, a, b, x[i+ 2], 11);
        b = md4_ff(b, c, d, a, x[i+ 3], 19);
        a = md4_ff(a, b, c, d, x[i+ 4], 3 );
        d = md4_ff(d, a, b, c, x[i+ 5], 7 );
        c = md4_ff(c, d, a, b, x[i+ 6], 11);
        b = md4_ff(b, c, d, a, x[i+ 7], 19);
        a = md4_ff(a, b, c, d, x[i+ 8], 3 );
        d = md4_ff(d, a, b, c, x[i+ 9], 7 );
        c = md4_ff(c, d, a, b, x[i+10], 11);
        b = md4_ff(b, c, d, a, x[i+11], 19);
        a = md4_ff(a, b, c, d, x[i+12], 3 );
        d = md4_ff(d, a, b, c, x[i+13], 7 );
        c = md4_ff(c, d, a, b, x[i+14], 11);
        b = md4_ff(b, c, d, a, x[i+15], 19);

        a = md4_gg(a, b, c, d, x[i+ 0], 3 );
        d = md4_gg(d, a, b, c, x[i+ 4], 5 );
        c = md4_gg(c, d, a, b, x[i+ 8], 9 );
        b = md4_gg(b, c, d, a, x[i+12], 13);
        a = md4_gg(a, b, c, d, x[i+ 1], 3 );
        d = md4_gg(d, a, b, c, x[i+ 5], 5 );
        c = md4_gg(c, d, a, b, x[i+ 9], 9 );
        b = md4_gg(b, c, d, a, x[i+13], 13);
        a = md4_gg(a, b, c, d, x[i+ 2], 3 );
        d = md4_gg(d, a, b, c, x[i+ 6], 5 );
        c = md4_gg(c, d, a, b, x[i+10], 9 );
        b = md4_gg(b, c, d, a, x[i+14], 13);
        a = md4_gg(a, b, c, d, x[i+ 3], 3 );
        d = md4_gg(d, a, b, c, x[i+ 7], 5 );
        c = md4_gg(c, d, a, b, x[i+11], 9 );
        b = md4_gg(b, c, d, a, x[i+15], 13);

        a = md4_hh(a, b, c, d, x[i+ 0], 3 );
        d = md4_hh(d, a, b, c, x[i+ 8], 9 );
        c = md4_hh(c, d, a, b, x[i+ 4], 11);
        b = md4_hh(b, c, d, a, x[i+12], 15);
        a = md4_hh(a, b, c, d, x[i+ 2], 3 );
        d = md4_hh(d, a, b, c, x[i+10], 9 );
        c = md4_hh(c, d, a, b, x[i+ 6], 11);
        b = md4_hh(b, c, d, a, x[i+14], 15);
        a = md4_hh(a, b, c, d, x[i+ 1], 3 );
        d = md4_hh(d, a, b, c, x[i+ 9], 9 );
        c = md4_hh(c, d, a, b, x[i+ 5], 11);
        b = md4_hh(b, c, d, a, x[i+13], 15);
        a = md4_hh(a, b, c, d, x[i+ 3], 3 );
        d = md4_hh(d, a, b, c, x[i+11], 9 );
        c = md4_hh(c, d, a, b, x[i+ 7], 11);
        b = md4_hh(b, c, d, a, x[i+15], 15);

        a = struct.addU32(a, olda);
        b = struct.addU32(b, oldb);
        c = struct.addU32(c, oldc);
        d = struct.addU32(d, oldd);

    }
    return [a, b, c, d];

};

/*
    These functions implement the basic operation for each round of the
    algorithm.
*/

var md4_cmn = function (q, a, b, x, s, t) {
    return struct.addU32(struct.rolU32(struct.addU32(a, q, x, t), s), b);
};
var md4_ff = function (a, b, c, d, x, s) {
    return md4_cmn((b & c) | ((~b) & d), a, 0, x, s, 0);
};
var md4_gg = function (a, b, c, d, x, s) {
    return md4_cmn((b & c) | (b & d) | (c & d), a, 0, x, s, 1518500249);
};
var md4_hh = function (a, b, c, d, x, s) {
    return md4_cmn(b ^ c ^ d, a, 0, x, s, 1859775393);
};

/*
    Calculate the HMAC-MD4, of a key and some data
*/
var core_hmac_md4 = function (key, data, _characterSize) {
    if (no(_characterSize))
        _characterSize = struct.characterSize;
    var bkey = struct.str2binl(key);
    if(bkey.length > 16) bkey = core_md4(bkey, key.length * _characterSize);

    var ipad = [], opad = [];
    for(var i = 0; i < 16; i++) {
        ipad[i] = bkey[i] ^ 0x36363636;
        opad[i] = bkey[i] ^ 0x5C5C5C5C;
    }

    var hash = core_md4(ipad.concat(struct.str2binl(data)), 512 + data.length * _characterSize);
    return core_md4(opad.concat(hash), 512 + 128);
};


/*license

    Legal
    =======
    
    Chiron is a component of the Tale web-game project.
    
    See <credit.txt> for a complete list of
    contributions and their licenses.  All contributions are provided
    under permissive, non-viral licenses including MIT, BSD, Creative Commons
    Attribution 2.5, Public Domain, or Unrestricted.
    
    
    License
    =======
    
    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    
    MIT License
    -----------
    
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.

*/

