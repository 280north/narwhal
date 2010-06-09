
// Copyright 2006-2010 webtoolkit.info
// http://www.webtoolkit.info/

// Secure Hash Algorithm (SHA256)
// Ported to Chiron and Narwhal by Kris Kowal

var struct = require('./struct');
var util = require('./narwhal/util');

/*** hash
*/
exports.hash = function (s, _characterSize) {
    if (util.no(_characterSize)) _characterSize = struct.characterSize;
    return struct.binb2bin(core(struct.str2binb(s, _characterSize), s.length * _characterSize));
};

var S  = function (X, n) { return ( X >>> n ) | (X << (32 - n)); }
var R  = function (X, n) { return ( X >>> n ); }
var Ch = function (x, y, z) { return ((x & y) ^ ((~x) & z)); }
var Maj = function (x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
var Sigma0256 = function (x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
var Sigma1256 = function (x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
var Gamma0256 = function (x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
var Gamma1256 = function (x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }

var K = [
    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
    0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
    0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
    0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
    0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
    0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
    0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
    0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
    0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
    0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
    0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
    0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
    0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
    0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
];

var core  = function (m, l) {
    var HASH = [
        0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
        0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19
    ];

    var W = [];
    var a, b, c, d, e, f, g, h, i, j;
    var T1, T2;

    m[l >> 5] |= 0x80 << (24 - l % 32);
    m[((l + 64 >> 9) << 4) + 15] = l;

    for ( i = 0; i<m.length; i+=16 ) {
        a = HASH[0];
        b = HASH[1];
        c = HASH[2];
        d = HASH[3];
        e = HASH[4];
        f = HASH[5];
        g = HASH[6];
        h = HASH[7];

        for ( j = 0; j<64; j++) {
            if (j < 16) W[j] = m[j + i];
            else W[j] = struct.addU32(Gamma1256(W[j - 2]), W[j - 7], Gamma0256(W[j - 15]), W[j - 16]);

            T1 = struct.addU32(h, Sigma1256(e), Ch(e, f, g), K[j], W[j]);
            T2 = struct.addU32(Sigma0256(a), Maj(a, b, c));

            h = g;
            g = f;
            f = e;
            e = struct.addU32(d, T1);
            d = c;
            c = b;
            b = a;
            a = struct.addU32(T1, T2);
        }

        HASH[0] = struct.addU32(a, HASH[0]);
        HASH[1] = struct.addU32(b, HASH[1]);
        HASH[2] = struct.addU32(c, HASH[2]);
        HASH[3] = struct.addU32(d, HASH[3]);
        HASH[4] = struct.addU32(e, HASH[4]);
        HASH[5] = struct.addU32(f, HASH[5]);
        HASH[6] = struct.addU32(g, HASH[6]);
        HASH[7] = struct.addU32(h, HASH[7]);
    }
    return HASH;
};

