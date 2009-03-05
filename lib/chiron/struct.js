/*file chiron src/struct.js */

/**

    Provides the `pack`, `unpack`, and `calcSize` routines with most of the same
    format specifiers as Python.  Also provides the functions `ord` and `chr`
    that are provided by Python as builtins but don't warrant inclusion in a
    JavaScript base library.

    .. table:: Format specifiers

       ===  =======  ===============  =========
            type     width            sign     
       ===  =======  ===============  =========
        x   pad      1                        
        c   char     1                        
        b   integer  1                signed  
        B   integer  1                unsigned
        h   integer  2                signed  
        H   integer  2                unsigned
        i   integer  4                signed  
        I   integer  4                unsigned
        l   integer  4                signed  
        L   integer  4                unsigned
        q   integer  8                signed  
        Q   integer  8                unsigned
        s   string   null terminated          
        p   string   null terminated          
        P   integer  4                unsigned
       ===  =======  ===============  =========
   
    A format specifier may be prefixed with a number to repeat that 
    specifier.

    An endianness specifier can be supplied anywhere in the stream:

     - ``<`` little-endian.
     - ``>`` big-endian. 
     - ``!`` big-endian, because it's network byte order.
     - ``=`` big-endian, because it's the native byte order.
     - ``@`` big-endian, because it's the native byte order, but 
       explicates native alignment.  This module does not support
       alignment in any case.

    JavaScript doesn't pack unsigned numbers in the high quad range,
    at least in Safari.

*/

/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

var base = require('boost');

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
exports.ord = base.operator(0, 'ord', function (chr) {
    return chr.charCodeAt();
});

/*** chr
    Returns the character for a given character code ordinal (offset in the
    ASCII or Unicode tables).

     - inverse: `ord`

*/
exports.chr = base.operator(0, 'chr', function (ord) {
    return String.fromCharCode(ord);
});

/*** pack

    Accepts:
     - a format specifier string, see `struct.js`.
     - any number of values to pack.

    Returns a byte string composed of the packed values.

*/
exports.pack = function (format /* * */) {
    var values = base.array(arguments);
    var format = values.shift();
    var endian = '>';
    var counter = 0;
    return base.eachIter(format, function (format) {
        if (format.match(/[@!<>]/)) {
            endian = endians[format];
            counter = 0;
            return '';
        } else if (format.match(/\d/)) {
            counter *= 10;
            counter += +format;
            return '';
        } else {
            if (counter == 0)
                counter = 1;
            return base.range(counter).eachIter(function () {
                return base.args(lookup[format], function (type, width, sign) {
                    if (type == 'integer') {
                        var packed = integerPackers[sign](values.shift(), width, sign);
                        if (endian == '<')
                            packed.reverse();
                        return packed.join('');
                    } else if (type == 'string') {
                        return values.shift() + '\0';
                    } else if (type == 'pad') {
                        return '\0';
                    } else {
                        throw new Error("pack: " + type);
                    }
                });
            }).join();
        }
    }).join();
};

var integerPackers = {
    'signed': function (number, width) {
        var output = [];
        for (var i = 0; i < width; i++) {
            output.unshift(exports.chr(number & 0xff));
            number >>= 8;
        }
        return output;
    },
    'unsigned': function (number, width) {
        var output = [];
        for (var i = 0; i < width; i++) {
            output.unshift(exports.chr(number & 0xff));
            number = Math.floor(number / 256);
        }
        return output;
    }
};

/*** unpack
*/
exports.unpack = function (format, bytes) {
    bytes = base.iter(bytes);
    var endian = '>';
    var counter = 0;
    return base.chain(base.eachIter(format, function (format) {
        if (format.match(/[@!<>]/)) {
            endian = endians[format];
            counter = 0;
            return [];
        } else if (format.match(/\d/)) {
            counter *= 10;
            counter += +format;
            return [];
        } else {
            if (counter == 0)
                counter = 1;
            var result = base.range(counter).eachIter(function () {
                return base.args(lookup[format], function (type, width, sign) {
                    if (type == 'integer') {
                        var field = base.take(bytes, width);
                        if (endian == '<') field.reverse();
                        return integerUnpackers[sign](field);
                    } else if (type == 'char') {
                        return bytes.next();
                    } else if (type == 'string') {
                        return base.takeWhile(bytes, exports.ord).join();
                    } else if (type == 'pad') {
                        bytes.next();
                        throw base.skipIteration;
                    } else {
                        throw new Error(
                            'unpack: ' +
                            format + ' ' +
                            type + ' ' +
                            width + ' ' +
                            sign
                        );
                    }
                });
            });
            counter = 0;
            return result;
        }
    })).list();
};

var integerUnpackers = {
    'signed': function (bytes) {
        var i = 0;
        base.forEach(bytes, function (byte) {
            i <<= 8;
            i |= exports.ord(byte);
        });
        return i;
    },
    'unsigned': function (bytes) {
        var i = 0;
        base.forEach(bytes, function (byte) {
            i *= 256;
            i += exports.ord(byte);
        });
        return i;
    }
};

/*** calcSize
*/
exports.calcSize = function (format) {
    var counter = 0;
    return base.sum(base.eachIter(format, function (format) {
        if (format.match(/[@!<>]/)) {
            counter = 0;
            return 0;
        } else if (format.match(/\d/)) {
            counter *= 10;
            counter += +format;
            return 0;
        } else {
            return base.args(lookup[format], function (type, width) {
                if (counter == 0)
                    counter = 1;
                var temp = width * counter;
                counter = 0;
                return temp;
            });
        }
    }), 0);
};

var shortIntWidth = 2;
var intWidth = 4;
var longIntWidth = 4;
var quadIntWidth = 8;
var floatWidth = 2;
var doubleFloatWidth = 4;
var pointerWidth = 4;

var table = [
    ['x', 'pad', 1],
    ['c', 'char', 1],
    ['b', 'integer', 1, 'signed'],
    ['B', 'integer', 1, 'unsigned'],
    ['h', 'integer', shortIntWidth, 'signed'],
    ['H', 'integer', shortIntWidth, 'unsigned'],
    ['i', 'integer', intWidth, 'signed'],
    ['I', 'integer', intWidth, 'unsigned'],
    ['l', 'integer', longIntWidth, 'signed'],
    ['L', 'integer', longIntWidth, 'unsigned'],
    ['q', 'integer', quadIntWidth, 'signed'],
    ['Q', 'integer', quadIntWidth, 'unsigned'],
    ['f', 'float', floatWidth],
    ['d', 'float', doubleFloatWidth],
    ['s', 'string'],
    ['p', 'string'],
    ['P', 'integer', pointerWidth, 'unsigned']
];

var lookup = base.eachApplyIter(table, function (code, type, width, sign) {
    return [code, [type, width, sign]];
}).object();

var endians = {
    '>': '>',
    '<': '<',
    '@': '>', /* native network byte order, no alignment support */
    '!': '>', /* explicitly network byte order, just in case you forgot */
    '=': '>' /* natively network byte order, again */
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
    if (base.no(_characterSize))
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
    if (base.no(_characterSize))
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
    if (base.no(_characterSize)) 
        _characterSize = exports.characterSize;
    var str = "";
    var mask = (1 << _characterSize) - 1;
    for (var i = 0; i < bin.length * 32; i += _characterSize)
        str += String.fromCharCode((bin[i>>5] >>> (i % 32)) & mask);
    return str;
};

/* undocumented binb2str
    Convert an array of big-endian words to a string
*/
exports.binb2str = function (bin, _characterSize) {
    if (base.no(_characterSize)) 
        _characterSize = exports.characterSize;
    var str = "";
    var mask = (1 << _characterSize) - 1;
    for (var i = 0; i < bin.length * 32; i += _characterSize)
        str += String.fromCharCode((bin[i>>5] >>> (32 - _characterSize - i % 32)) & mask);
    return str;
};

/* undocumented binl2hex
    Convert an array of little-endian words to a hex string.
*/
exports.binl2hex = function (binarray, _alphabet16) {
    if (base.no(_alphabet16))
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
    if (base.no(_alphabet16))
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

