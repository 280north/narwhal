
// Ash Searle
// Ported by Kris Kowal

/** provides printf and sprintf.

    This code is unrestricted: you are free to use it however you like.

    The functions should work as expected, performing left or right alignment,
    truncating strings, outputting numbers with a required precision etc.

    For complex cases, these functions follow the Perl implementations of
    (s)printf, allowing arguments to be passed out-of-order, and to set the
    precision or length of the output based on arguments instead of fixed
    numbers.

    See http://perldoc.perl.org/functions/sprintf.html for more information.

    Implemented:
     - zero and space-padding
     - right and left-alignment,
     - base X prefix (binary, octal and hex)
     - positive number prefix
     - (minimum) width
     - precision / truncation / maximum width
     - out of order arguments

    Not implemented (yet):
     - vector flag
     - size (bytes, words, long-words etc.)

    Will not implement:
     - %n or %p (no pointers in JavaScript)

    by Ash Searle, 2007-04-27
    Integrated into Chiron by Kris Kowal, 2007-10-19
    Integrated into Narwhal by Kris Kowal, 2009-07-27

*/

exports.printf = function () {
    print(exports.sprintf.apply(null, arguments));
};

exports.fprintf = function () {
    var args = Array.prototype.slice.call(arguments);
    var stream = args.shift();
    stream.print(exports.sprintf.apply(null, args));
};

exports.sprintf = function () {

    var a = arguments, i = 1, format = a[0];
    return format.replace(regex, function ($0, valueIndex, flags, minWidth, precision, type) {
        if ($0 == '%%') return '%';

        // parse flags
        var leftJustify    = flags.indexOf('-') > -1,
            positivePrefix = (flags.match(/[ +]/g) || ['']).pop(),
            zeroPad        = flags.indexOf('0') > -1,
            prefixBaseX    = flags.indexOf('#') > -1;

        // parameters may be null, undefined, empty-string or real valued
        // we want to ignore null, undefined and empty-string values

        if (!minWidth)
            minWidth = 0;
        else if (minWidth == '*')
            minWidth = +a[i++];
        else if (minWidth.charAt(0) == '*')
            minWidth = +a[minWidth.slice(1, -1)];
        else
            minWidth = +minWidth;

        // Note: undocumented perl feature:
        if (minWidth < 0) {
            minWidth = -minWidth;
            leftJustify = true;
        }

        if (!isFinite(minWidth))
            throw new Error('sprintf: (minimum-)width must be finite');

        if (!precision)
            precision = 'fFeE'.indexOf(type) > -1 ? 6 : (type == 'd' ? 0 : void(0));
        else if (precision == '*')
            precision = +a[i++];
        else if (precision.charAt(0) == '*')
            precision = +a[precision.slice(1, -1)];
        else
            precision = +precision;

        // grab value using valueIndex if required?
        var value = valueIndex ? a[valueIndex] : a[i++];

        switch (type) {
            case 's': return formatString(String(value), leftJustify, minWidth, precision, zeroPad);
            case 'c': return formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, zeroPad);
            case 'b': return formatBaseX(value, 2, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'o': return formatBaseX(value, 8, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'x': return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'X': return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad).toUpperCase();
            case 'u': return formatBaseX(value, 10, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'i':
            case 'd': {
                      var number = parseInt(+value);
                      var prefix = number < 0 ? '-' : positivePrefix;
                      value = prefix + pad(String(Math.abs(number)), precision, '0', false);
                      return justify(value, prefix, leftJustify, minWidth, zeroPad);
            }
            case 'e':
            case 'E':
            case 'f':
            case 'F':
            case 'g':
            case 'G': {
                      var number = +value;
                      var prefix = number < 0 ? '-' : positivePrefix;
                      var method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())];
                      var textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2];
                      value = prefix + Math.abs(number)[method](precision);
                      return justify(value, prefix, leftJustify, minWidth, zeroPad)[textTransform]();
            }
            default: return $0;
        }
    });
}

var pad = function (str, len, chr, leftJustify) {
    var padding = (str.length >= len) ? '' : Array(1 + len - str.length >>> 0).join(chr);
    return leftJustify ? str + padding : padding + str;
};

var justify = function (value, prefix, leftJustify, minWidth, zeroPad) {
    var diff = minWidth - value.length;
    if (diff > 0) {
        if (leftJustify || !zeroPad) {
            value = pad(value, minWidth, ' ', leftJustify);
        } else {
            value = value.slice(0, prefix.length) + pad('', diff, '0', true) + value.slice(prefix.length);
        }
    }
    return value;
};

var formatBaseX = function (value, base, prefix, leftJustify, minWidth, precision, zeroPad) {
    // Note: casts negative numbers to positive ones
    var number = value >>> 0;
    prefix = prefix && number && {'2': '0b', '8': '0', '16': '0x'}[base] || '';
    value = prefix + pad(number.toString(base), precision || 0, '0', false);
    return justify(value, prefix, leftJustify, minWidth, zeroPad);
};

var formatString = function (value, leftJustify, minWidth, precision, zeroPad) {
    if (precision != null) {
        value = value.slice(0, precision);
    }
    return justify(value, '', leftJustify, minWidth, zeroPad);
};

var regex = /%(?:%|(?:(\d+)\$)?([-+#0 ]*)([1-9][0-9]*|\*(?:[0-9]+\$)?)?(?:\.([0-9]+|\*(?:[0-9]+\$)?))?([csduoxefgXEGbi]))/g;

/*
    References
    ==========

    http://www.webtoolkit.info/javascript-sprintf.html
    An alternate implementation, if this one does not perform well
    in practice.

*/

