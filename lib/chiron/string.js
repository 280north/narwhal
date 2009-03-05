/*file chiron src/base/string.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

var boot = require('./boot');
var type = require('./type');
var operator = require('./operator');
var iter = require('./iter');
var list = require('./list');
var set = require('./set');
var dict = require('./dict');
var each = require('./each');
var range = require('./range');

/**

    Strings
    =======

*/

/*** string
     - `polymorphic`
     - `stateless`
*/
exports.string = type.operator(1, 'string', function (value, recur) {
    if (boot.no(value)) return '';
    if (type.isInstance(value, Function)) return type.repr(value);
    if (type.isInstance(value, Array)) return exports.join(value);
    if (type.isInstance(value, Object)) return dict.Dict(value).string(recur);
    if (type.isInstance(value, Error))
        return value.message + "\n" + "in " + value.fileName + "\n";
    return '' + value;
});

/*** split
     - not `polymorphic`, override `string`.
*/
exports.split = function (value, delimiter) {
    if (boot.no(delimiter)) delimiter = '';
    return list.List(exports.string(value).split(delimiter));
};

/*** join
     - not `polymorphic`, override `array`.
*/
exports.join = function (values, delimiter) {
    if (boot.no(delimiter)) delimiter = '';
    return list.array(values).join(delimiter);
};

/*** first
     - `polymorphic`
     - `currys` with less than 2 arguments.
*/
exports.first = type.operator(1, 'first', function (value, n) {
    if (boot.no(n)) return dict.get(value, 0);
    return value.slice(0, n);
});

/*** last
     - `polymorphic`
     - `currys` with less than 2 arguments.
*/
exports.last = type.operator(1, 'last', function (value, n) {
    if (boot.no(n)) return dict.get(value, list.len(value) - 1);
    return value.slice(value.length - n, value.length);
});

/*** begins
     - `polymorphic`
     - `currys` with less than 2 arguments.
*/
exports.begins = type.operator(2, 'begins', function (value, begin) {
    return operator.eq(
        list.slice(value, 0, list.len(begin)),
        type.as(begin, type.getType(value))
    );
});

/*** ends
     - `polymorphic`
     - `currys` with less than 2 arguments.
*/
exports.ends = type.operator(2, 'ends', function (value, end) {
    return operator.eq(
        list.slice(value, value.length - end.length, value.length),
        type.as(end, type.getType(value))
    );
});

/*** escape
    escapes all characters of a string that are
    special to JavaScript and many other languages.
    Recognizes all of the relevant
    control characters and formats all other
    non-printable characters as Hex byte escape
    sequences or Unicode escape sequences depending
    on their size.

    Pass ``true`` as an optional second argument and
    ``escape`` produces valid contents for escaped
    JSON strings, wherein non-printable-characters are
    all escaped with the Unicode ``\u`` notation.
*/
/* more Steve Levithan flagrence */
var escapeExpression = /[^ !#-[\]-~]/g;
/* from Doug Crockford's JSON library */
var escapePatterns = {
    '\b': '\\b',    '\t': '\\t',
    '\n': '\\n',    '\f': '\\f',    '\r': '\\r',
    '"' : '\\"',    '\\': '\\\\'
};
exports.escape = function (value, strictJson) {
    if (typeof value != "string")
        throw new Error("base/string#escape: requires a string.  got " + type.repr(value));
    return value.replace(
        escapeExpression, 
        function (match) {
            if (escapePatterns[match])
                return escapePatterns[match];
            match = match.charCodeAt();
            if (!strictJson && match < 256)
                return "\\x" + exports.padBegin(match.toString(16), 2);
            return '\\u' + exports.padBegin(match.toString(16), 4);
        }
    );
};

/*** enquote
    transforms a string into a string literal, escaping
    all characters of a string that are special to
    JavaScript and and some other languages.

    ``enquote`` uses double quotes to be JSON compatible.

    Pass ``true`` as an optional second argument to
    be strictly JSON compliant, wherein all
    non-printable-characters are represented with
    Unicode escape sequences.
*/
exports.enquote = function (value, strictJson) {
    return '"' + exports.escape(value, strictJson) + '"';
};

/*** expand
    transforms tabs to an equivalent number of spaces.
*/ /* [#expand]_ */
/*todo special case for \r if it ever matters */
exports.expand = function (str, tabLength) {
    str = exports.string(str);
    tabLength = tabLength || 4;
    var output = [],
        tabLf = /[\t\n]/g,
        lastLastIndex = 0,
        lastLfIndex = 0,
        charsAddedThisLine = 0,
        tabOffset, match;
    while (match = tabLf.exec(str)) {
        if (match[0] == "\t") {
            tabOffset = (
                tabLength - 1 -
                (
                    (match.index - lastLfIndex) +
                    charsAddedThisLine
                ) % tabLength
            );
            charsAddedThisLine += tabOffset;
            output.push(
                str.slice(lastLastIndex, match.index) +
                operator.mul(" ", tabOffset + 1)
            );
        } else if (match[0] === "\n") {
            output.push(str.slice(lastLastIndex, tabLf.lastIndex));
            lastLfIndex = tabLf.lastIndex;
            charsAddedThisLine = 0;
        }
        lastLastIndex = tabLf.lastIndex;
    }
    return output.join("") + str.slice(lastLastIndex);
};

/*** tripBegin
     - not `polymorphic`.  only operates on `String` objects.
*/
var trimBeginExpression = /^\s\s*/g;
exports.trimBegin = function (value) {
	return exports.string(value).replace(trimBeginExpression, "");	
};

/*** trimEnd
     - not `polymorphic`.  only operates on `String` objects.
*/
var trimEndExpression = /\s\s*$/g;
exports.trimEnd = function (value) {
	return exports.string(value).replace(trimEndExpression, "");	
};

/*** trim
     - not `polymorphic`.  only operates on `String` objects.
*/
exports.trim = function (value) {
	return exports.string(value).replace(trimBeginExpression, "").replace(trimEndExpression, "");
};

/*** splitName
    splits a string into a `List` of words from an origin
    string.
*/
var splitNameExpression = /[a-z]+|[A-Z](?:[a-z]+|[A-Z]*(?![a-z]))|[.\d]+/g;
exports.splitName = function (value) {
    return list.List(exports.string(value).match(splitNameExpression));
};

/*** joinName
    joins a list of words with a given delimiter
    between alphanumeric words.
*/
exports.joinName = function (delimiter, parts) {
    parts = list.List(parts);
    if (boot.no(delimiter)) delimiter = '_';
    parts.unshift(list.List());
    return parts.reduced(function (parts, part) {
        if (
            part.match(/\d/) &&
            list.len(parts) && parts.last().match(/\d/)
        ) {
            return operator.add(parts, [delimiter + part]);
        } else {
            return operator.add(parts, [part]);
        }
    }).get(0).join('');
};

/*** upper
    converts a name to ``UPPER CASE`` using
    a given delimiter between numeric words.

    see:
     - `lower`
     - `camel`
     - `title`

*/
exports.upper = function (value, delimiter) {
    if (boot.no(delimiter))
        return exports.string(value).toUpperCase();
    return exports.splitName(value).each(function (part) {
        return part.toUpperCase();
    }).join(delimiter);
};

/*** lower
    converts a name to a ``lower case`` using
    a given delimiter between numeric words.

    see:
     - `upper`
     - `camel`
     - `title`

*/
exports.lower = function (value, delimiter) {
    if (boot.no(delimiter))
        return exports.string(value).toLowerCase();
    return exports.splitName(value).each(function (part) {
        return part.toLowerCase();
    }).join(delimiter);
};

/*** camel
    converts a name to ``camel Case`` using
    a given delimiter between numeric words.

    see:
     - `lower`
     - `upper`
     - `title`

*/
exports.camel = function (value, delimiter) {
    return exports.joinName(
        delimiter,
        exports.splitName(value).enumerateIter().eachApplyIter(function (n, part) {
            if (n) {
                return (
                    part.substring(0, 1).toUpperCase() +
                    part.substring(1).toLowerCase()
                );
            } else {
                return part.toLowerCase();
            }
        })
    );
};

/*** title
    converts a name to ``Title Case`` using
    a given delimiter between numeric words.

    see:
     - `lower`
     - `upper`
     - `camel`

*/
exports.title = function (value, delimiter) {
    return exports.joinName(
        delimiter,
        exports.splitName(value).each(function (part) {
            return (
                part.substring(0, 1).toUpperCase() +
                part.substring(1).toLowerCase()
            );
        })
    );
};

/* generates padBegin and padEnd */
var augmentor = function (augment) {
    return function (value, length, pad) {
        if (boot.no(pad)) pad = '0';
        if (boot.no(length)) length = 2;
        value = exports.string(value);
        while (value.length < length) {
            value = augment(value, pad);
        }
        return value;
    };
};

/*** padBegin

    accepts:
     - a `String` or `Number` value
     - a minimum length of the resultant `String`:
       by default, 2
     - a pad string: by default, ``'0'``.

    returns a `String` of the value padded up to at least
    the minimum length.  adds the padding to the begining
    side of the `String`.

     - not `polymorphic`.  only operates on `String` objects.

*/
exports.padBegin = augmentor(function (value, pad) {
    return pad + value;
});

/*** padEnd

    accepts:
     - a `String` or `Number` value
     - a minimum length of the resultant `String`:
       by default, 2
     - a pad string: by default, ``'0'``.

    returns a `String` of the value padded up to at least
    the minimum length.  adds the padding to the end
    side of the `String`.

     - not `polymorphic`.  only operates on `String` objects.

*/
exports.padEnd = augmentor(function (value, pad) {
    return value + pad;
});


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

