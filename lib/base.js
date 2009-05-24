
exports.no = function (value) {
    return value === null || value === undefined;
};

// object

exports.object = function (object) {
    var copy = {};
    Object.keys(object).forEach(function (key) {
        copy[key] = object[key];
    });
    return copy;
};

exports.object.copy = exports.object;

exports.object.has = function (object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
};

exports.object.keys = function (object) {
    var keys = [];
    for (var name in object) {
        if (Object.prototype.hasOwnProperty.call(object, name)) {
            keys.push(name);
        }
    }
    return keys;
};

exports.object.values = function (object) {
    var values = [];
    Object.keys(object).forEach(function (key) {
        values.push(object[key]);
    });
    return values;
};

exports.object.items = function (object) {
    var items = [];
    Object.keys(object).forEach(function (key) {
        items.push([key, object[key]]);
    });
    return items;
};

exports.object.repr = function (object) {
    return "{" +
        exports.object.keys(object)
        .map(function (key) {
            return exports.enquote(key) + ": " +
                exports.repr(object[key]);
        }).join(", ") +
    "}";
};

// array

exports.array = function (array) {
    return Array.prototype.slice.call(array);
};

exports.array.copy = exports.array;

exports.array.eq = function (a, b) {
    return Array.isArray(b) &&
        a.length == b.length &&
        exports.zip(a, b).every(exports.apply(exports.eq));
};

exports.array.repr = function (array) {
    return "[" + array.map(exports.repr).join(', ') + "]";
};

// object.eq


// operator

// a decorator for functions that curry "polymorphically",
// that is, that return a function that can be tested
// against various objects if they're only "partially
// completed", or fewer arguments than needed are used.
// 
// this enables the idioms:
//      [1, 2, 3].every(lt(4)) eq true
//      [1, 2, 3].map(add(1)) eq [2, 3, 4]
//      [{}, {}, {}].forEach(set('a', 10))
//
exports.operator = function (name, length, block) {
    var operator = function () {
        var args = exports.array(arguments);
        var completion = function (object) {
            if (!exports.no(object) && object[name])
                return object[name].apply(
                    object,
                    args
                )
            else
                return block.apply(
                    this,
                    [object].concat(args)
                );
        };
        if (arguments.length < length) {
            // polymoprhic curry, delayed completion
            return completion;
        } else {
            // immediate completion
            return completion.call(this, args.shift());
        }
    };
    operator.displayName = name;
    operator.length = length;
    operator.operator = block;
    return operator;
};

exports.apply = exports.operator('apply', 2, function (args, block) {
    return block.apply(this, args);
});

exports.copy = function (object) {
    if (exports.no(object))
        return object;
    if (Array.isArray(object))
        return exports.array.copy(object);
    if (typeof object == 'object')
        return exports.object.copy(object);
    return object;
};

exports.repr = function (object) {
    if (exports.no(object))
        return String(object);
    if (Array.isArray(object))
        return exports.array.repr(object);
    if (typeof object == 'object')
        return exports.object.repr(object);
    if (typeof object == 'string')
        return exports.enquote(object);
    return object.toString();
};

exports.keys = function (object) {
    if (Array.isArray(object))
        return exports.range(object.length);
    else if (typeof object == 'object')
        return exports.object.keys(object);
    return [];
};

exports.values = function (object) {
    if (Array.isArray(object))
        return exports.array(object);
    else if (typeof object == 'object')
        return exports.object.values(object);
    return [];
};

exports.items = function (object) {
    if (Array.isArray(object))
        return exports.array(object);
    else if (typeof object == 'object')
        return exports.object.items(object);
    return [];
};

exports.has = exports.operator('has', 2, function (object, value) {
    if (Array.isArray(object))
        return exports.array.has(object, value);
    else if (typeof object == 'object')
        return exports.object.has(object, value);
    return false;
});

// get
// set
// getset
// del
// put
// cut

// insert
// remove
// discard
// update
// complete

// iterator
// range

exports.range = function () {
    var start = 0, stop = 0, step = 1;
    if (arguments.length == 1) {
        stop = arguments[0];
    } else if (arguments.length == 2) {
        start = arguments[0];
        stop = arguments[1];
    } else if (arguments.length == 3) {
        start = arguments[0];
        stop = arguments[1];
        step = arguments[2];
    }
    var range = [];
    for (var i = start; i < stop; i += step)
        range.push(i);
    return range;
};

// forEach
exports.forEach = function (array, block) {
    Array.prototype.forEach.call(array, block);
};

// map
exports.map = function (array, block) {
    return Array.prototype.map.call(array, block);
};

// filter
// every
// some

exports.all = exports.operator('all', 1, function (array) {
    for (var i = 0; i < array.length; i++)
        if (!array[i])
            return false;
    return true;
});

exports.any = exports.operator('all', 1, function (array) {
    for (var i = 0; i < array.length; i++)
        if (array[i])
            return true;
    return false;
});

// reduce
// reduceRight

exports.zip = function () {
    return exports.transpose.apply(this, arguments);
};

exports.transpose = function (array) {
    var transpose = [];
    for (var i = 0; i < array.length; i++) {
        var row = array[i];
        for (var j = 0; j < row.length; j++) {
            var cell = row[j];
            if (!transpose[j])
                transpose[j] = [];
            transpose[j][i] = cell;
        }
    }
    return transpose;
};

// arithmetic, transitive, and logical operators

exports.is = exports.operator('is', 2, function (a, b) {
    return a === b;
});

exports.eq = exports.operator('eq', 2, function (a, b) {
    if (exports.no(a))
        return exports.no(b);
    if (Array.isArray(a))
        return exports.array.eq(a, b);
    if (typeof a == 'object')
        return exports.object.eq(a, b);
    return a == b;
});

exports.ne = exports.operator('ne', 2, function (a, b) {
    return !exports.eq(a, b);
});

// lt
// gt
// le
// ge
// by
// compare

// string

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
        throw new Error("base/string#escape: requires a string.  got " + exports.repr(value));
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
*/
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
	return String(value).replace(trimBeginExpression, "");	
};

/*** trimEnd
     - not `polymorphic`.  only operates on `String` objects.
*/
var trimEndExpression = /\s\s*$/g;
exports.trimEnd = function (value) {
	return String(value).replace(trimEndExpression, "");	
};

/*** trim
     - not `polymorphic`.  only operates on `String` objects.
*/
exports.trim = function (value) {
	return String(value).replace(trimBeginExpression, "").replace(trimEndExpression, "");
};

