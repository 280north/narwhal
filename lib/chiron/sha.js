/*file chiron src/crypt/sha.js */

/*

    A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
    in FIPS PUB 180-1
    Version 2.1a Copyright Paul Johnston 2000 - 2002.
    Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
    Distributed under the BSD License
    See http://pajhome.org.uk/crypt/md5 for details.

*/

/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

var base = require('./base');
var struct = require('./struct');

/*** hash
*/
exports.hash = function (s) {
    return exports.hex_sha(s);
};

/*undocumented
    These are the functions you'll usually want to call
    They take string arguments and return either hex or base-64 encoded strings
*/
exports.hex_sha = function (s, _characterSize) {
    if (base.no(_characterSize)) _characterSize = struct.characterSize;
    return struct.binb2hex(core_sha(struct.str2binb(s), s.length * _characterSize));
};
exports.base64_sha = function (s, _characterSize) {
    if (base.no(_characterSize)) _characterSize = struct.characterSize;
    return struct.binb2base64(core_sha(struct.str2binb(s),s.length * _characterSize));
};
exports.str_sha = function (s, _characterSize) {
    if (base.no(_characterSize)) _characterSize = struct.characterSize;
    return struct.binb2str(core_sha(struct.str2binb(s),s.length * _characterSize));
};
exports.hex_hmac_sha = function (key, data) {
    return struct.binb2hex(core_hmac_sha(key, data));
};
exports.base64_hmac_sha = function (key, data) {
    return struct.binb2base64(core_hmac_sha(key, data));
};
exports.str_hmac_sha = function (key, data) {
    return struct.binb2str(core_hmac_sha(key, data));
};

/* Perform a simple self-test to see if the VM is working */
exports.sha_vm_test = function () {
  return hex_sha("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
};

/* Calculate the SHA-1 of an array of big-endian words, and a bit length */
var core_sha = function (x, len) {
    /* append padding */
    x[len >> 5] |= 0x80 << (24 - len % 32);
    x[((len + 64 >> 9) << 4) + 15] = len;

    var w = [];
    var a =  1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d =  271733878;
    var e = -1009589776;

    for(var i = 0; i < x.length; i += 16) {
        var olda = a;
        var oldb = b;
        var oldc = c;
        var oldd = d;
        var olde = e;

        for(var j = 0; j < 80; j++) {
            if(j < 16) w[j] = x[i + j];
            else w[j] = struct.rolU32(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
            var t = struct.addU32(struct.rolU32(a, 5), sha_ft(j, b, c, d), e, w[j], sha_kt(j));
            e = d;
            d = c;
            c = struct.rolU32(b, 30);
            b = a;
            a = t;
        }

        a = struct.addU32(a, olda);
        b = struct.addU32(b, oldb);
        c = struct.addU32(c, oldc);
        d = struct.addU32(d, oldd);
        e = struct.addU32(e, olde);
    }
    return [a, b, c, d, e];

};

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
var sha_ft = function (t, b, c, d) {
    if(t < 20) return (b & c) | ((~b) & d);
    if(t < 40) return b ^ c ^ d;
    if(t < 60) return (b & c) | (b & d) | (c & d);
    return b ^ c ^ d;
};

/*
 * Determine the appropriate additive constant for the current iteration
 */
var sha_kt = function (t) {
    return (t < 20) ?    1518500249 : (t < 40) ?    1859775393 :
                 (t < 60) ? -1894007588 : -899497514;
};

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
var core_hmac_sha = function (key, data, _characterSize) {
    if (base.no(_characterSize)) _characterSize = struct.characterSize;
    var bkey = struct.str2binb(key);
    if(bkey.length > 16) bkey = core_sha(bkey, key.length * _characterSize);

    var ipad = [], opad = [];
    for(var i = 0; i < 16; i++) {
        ipad[i] = bkey[i] ^ 0x36363636;
        opad[i] = bkey[i] ^ 0x5C5C5C5C;
    }

    var hash = core_sha(ipad.concat(struct.str2binb(data)), 512 + data.length * _characterSize);
    return core_sha(opad.concat(hash), 512 + 160);
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

