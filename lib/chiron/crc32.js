/*file chiron src/crypt/crc32.js */

/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

var base = require('./base');

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
    if (base.no(table))
        table = exports.table;
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bin.length; i ++) {
        var x = bin.charCodeAt(i);
        if (x & ~0xFF)
            throw new Error(
                "crc32 can only encode strings of bytes.  " +
                "Consider using crypt/utf8.js#encode."
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

