/*file chiron src/crypt/base64.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

var struct = require('./struct');

/**
    provides methods for encoding and decoding base64 data.
*/

/* construct lookup tables and regular expressions */
var zerone = {};
for (var i = 0; i < struct.alphabet64.length; i++) {
    zerone[struct.alphabet64.charAt(i)] = i;
}

/*** encode
    encodes a string in the base64 alphabet.
*/
// see Tyler Atkins
exports.encode = function (input) {
    var output = [];
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = -1;
        } else if (isNaN(chr3)) {
            enc4 = -1;
        }

        output.push(
            struct.alphabet64.charAt(enc1) || struct.padBase64,
            struct.alphabet64.charAt(enc2) || struct.padBase64,
            struct.alphabet64.charAt(enc3) || struct.padBase64,
            struct.alphabet64.charAt(enc4) || struct.padBase64
        );
    }

    return output.join('');
};

/*** decode
    decodes a string from the base64 alphabet.
*/
exports.decode = function (input) {
    var output = [];
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    /* remove all characters that are not A-Z, a-z, 0-9, +, /, or = */
    input = input.replace(/[^A-Za-z0-9\+\/=]/g, "");

    while (i < input.length) {

        enc1 = struct.alphabet64.indexOf(input.charAt(i++));
        enc2 = struct.alphabet64.indexOf(input.charAt(i++));
        enc3 = struct.alphabet64.indexOf(input.charAt(i++));
        enc4 = struct.alphabet64.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output.push(String.fromCharCode(chr1));

        if (enc3 != -1) {
            output.push(String.fromCharCode(chr2));
        }
        if (enc4 != -1) {
            output.push(String.fromCharCode(chr3));
        }

    }

    return output.join('');
};

/**

    References
    ==========

    <http://en.wikipedia.org/wiki/Base64/>
    Parts of the original implementation from Wikipedia's article on Base64 encoding.

    <http://rumkin.com/>
    The ``encode`` implementation by Tyler Atkin's was correct in more cases
    than the Wikipedia version.

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

