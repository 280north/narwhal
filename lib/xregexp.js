
/*!
    XRegExp 0.6.1
    Copyright (c) 2007-2008 Steven Levithan <http://stevenlevithan.com>
    MIT license
    Based on XRegExp 0.5.1

    Ported by Kris Kowal
*/

// RegExp

/** provides an augmented, cross-browser implementation of regular expressions
    including support for additional modifiers and syntax. several convenience
    methods and a recursive-construct parser are also included.
*/

/** provides an augmented, cross-browser implementation of regular expressions
    including support for additional modifiers and syntax. several convenience
    methods and a recursive-construct parser are also included.
*/

// copy various native globals for reference. can't use the name ``native``
// because it's a reserved JavaScript keyword.
var real = {
        exec:    RegExp.prototype.exec,
        match:   String.prototype.match,
        replace: String.prototype.replace,
        split:   String.prototype.split
    },
    /* regex syntax parsing with support for all the necessary cross-
       browser and context issues (escapings, character classes, etc.) */
    lib = {
        part:       /(?:[^\\([#\s.]+|\\(?!k<[\w$]+>|[pP]{[^}]+})[\S\s]?|\((?=\?(?!#|<[\w$]+>)))+|(\()(?:\?(?:(#)[^)]*\)|<([$\w]+)>))?|\\(?:k<([\w$]+)>|[pP]{([^}]+)})|(\[\^?)|([\S\s])/g,
        replaceVar: /(?:[^$]+|\$(?![1-9$&`']|{[$\w]+}))+|\$(?:([1-9]\d*|[$&`'])|{([$\w]+)})/g,
        extended:   /^(?:\s+|#.*)+/,
        quantifier: /^(?:[?*+]|{\d+(?:,\d*)?})/,
        classLeft:  /&&\[\^?/g,
        classRight: /]/g
    },
    indexOf = function (array, item, from) {
        for (var i = from || 0; i < array.length; i++)
            if (array[i] === item) return i;
        return -1;
    },
    brokenExecUndef = /()??/.exec("")[1] !== undefined,
    plugins = {};

/*** XRegExp
    accepts a pattern and flags, returns a new, extended RegExp object.
    differs from a native regex in that additional flags and syntax are
    supported and browser inconsistencies are ameliorated.
*/
XRegExp = function (pattern, flags) {
    if (pattern instanceof RegExp) {
        if (flags !== undefined)
            throw TypeError("can't supply flags when constructing one RegExp from another");
        return pattern.addFlags(); // new copy
    }

    var flags           = flags || "",
        singleline      = flags.indexOf("s") > -1,
        extended        = flags.indexOf("x") > -1,
        hasNamedCapture = false,
        captureNames    = [],
        output          = [],
        part            = lib.part,
        match, cc, len, index, regex;

    part.lastIndex = 0; // in case the last XRegExp compilation threw an error (unbalanced character class)

    while (match = real.exec.call(part, pattern)) {
        // comment pattern. this check must come before the capturing group check,
        // because both match[1] and match[2] will be non-empty.
        if (match[2]) {
            // keep tokens separated unless the following token is a quantifier
            if (!lib.quantifier.test(pattern.slice(part.lastIndex)))
                output.push("(?:)");
        // capturing group
        } else if (match[1]) {
            captureNames.push(match[3] || null);
            if (match[3])
                hasNamedCapture = true;
            output.push("(");
        // named backreference
        } else if (match[4]) {
            index = indexOf(captureNames, match[4]);
            // keep backreferences separate from subsequent literal numbers
            // preserve backreferences to named groups that are undefined at this point as literal strings
            output.push(index > -1 ?
                "\\" + (index + 1) + (isNaN(pattern.charAt(part.lastIndex)) ? "" : "(?:)") :
                match[0]
            );
        // unicode element (requires plugin)
        } else if (match[5]) {
            output.push(plugins.unicode ?
                plugins.unicode.get(match[5], match[0].charAt(1) === "P") :
                match[0]
            );
        // character class opening delimiter ("[" or "[^")
        // (non-native unicode elements are not supported within character classes)
        } else if (match[6]) {
            if (pattern.charAt(part.lastIndex) === "]") {
                // for cross-browser compatibility with ECMA-262 v3 behavior,
                // convert [] to (?!) and [^] to [\S\s].
                output.push(match[6] === "[" ? "(?!)" : "[\\S\\s]");
                part.lastIndex++;
            } else {
                // parse the character class with support for inner escapes and
                // ES4's infinitely nesting intersection syntax ([&&[^&&[]]]).
                cc = XRegExp.matchRecursive("&&" + pattern.slice(match.index), lib.classLeft, lib.classRight, "", {escapeChar: "\\"})[0];
                output.push(match[6] + cc + "]");
                part.lastIndex += cc.length + 1;
            }
        // dot ("."), pound sign ("#"), or whitespace character
        } else if (match[7]) {
            if (singleline && match[7] === ".") {
                output.push("[\\S\\s]");
            } else if (extended && lib.extended.test(match[7])) {
                len = real.exec.call(lib.extended, pattern.slice(part.lastIndex - 1))[0].length;
                // keep tokens separated unless the following token is a quantifier
                if (!lib.quantifier.test(pattern.slice(part.lastIndex - 1 + len)))
                    output.push("(?:)");
                part.lastIndex += len - 1;
            } else {
                output.push(match[7]);
            }
        } else {
            output.push(match[0]);
        }
    }

    regex = RegExp(output.join(""), real.replace.call(flags, /[sx]+/g, ""));
    regex._x = {
        source:       pattern,
        captureNames: hasNamedCapture ? captureNames : null
    };
    return regex;
};

// barebones plugin support for now (intentionally undocumented)
XRegExp.addPlugin = function (name, o) {
    plugins[name] = o;
};

/*** RegExp.prototype.exec
    adds named capture support, with values returned as ``result.name``.
    also fixes two cross-browser issues, following the ECMA-262 v3 spec:
     - captured values for non-participating capturing groups should be returned
       as ``undefined``, rather than the empty string.
     - the regex's ``lastIndex`` should not be incremented after zero-length
       matches.
*/
RegExp.prototype.exec = function (str) {
    var match = real.exec.call(this, str),
        name, i, r2;
    if (match) {
        // fix browsers whose exec methods don't consistently return
        // undefined for non-participating capturing groups
        if (brokenExecUndef && match.length > 1) {
            // r2 doesn't need /g or /y, but they shouldn't hurt
            r2 = new RegExp("^" + this.source + "$(?!\\s)", this.getNativeFlags());
            real.replace.call(match[0], r2, function () {
                for (i = 1; i < arguments.length - 2; i++) {
                    if (arguments[i] === undefined) match[i] = undefined;
                }
            });
        }
        // attach named capture properties
        if (this._x && this._x.captureNames) {
            for (i = 1; i < match.length; i++) {
                name = this._x.captureNames[i - 1];
                if (name) match[name] = match[i];
            }
        }
        // fix browsers that increment lastIndex after zero-length matches
        if (this.global && this.lastIndex > (match.index + match[0].length))
            this.lastIndex--;
    }
    return match;
};

/*** String.prototype.match
    run the altered ``exec`` when called with a non-global regex.
*/
String.prototype.match = function (regex) {
    if (!(regex instanceof RegExp))
        regex = new XRegExp(regex);
    if (regex.global)
        return real.match.call(this, regex);
    return regex.exec(this); // run the altered exec
};

/*** String.prototype.replace
    add named capture support to replacement strings using the syntax
    ``${name}``, and to replacement functions as ``arguments[0].name``.
*/
String.prototype.replace = function (search, replacement) {
    var captureNames = (search._x || {}).captureNames;

    // if search is not a regex which uses named capture, use the native replace method
    if (!(search instanceof RegExp && captureNames))
        return real.replace.apply(this, arguments);

    if (typeof replacement === "function") {
        return real.replace.call(this, search, function () {
            // change the arguments[0] string primitive to a String object which can store properties
            arguments[0] = new String(arguments[0]);
            // store named backreferences on arguments[0] before calling replacement
            for (var i = 0; i < captureNames.length; i++) {
                if (captureNames[i])
                    arguments[0][captureNames[i]] = arguments[i + 1];
            }
            return replacement.apply(window, arguments);
        });
    } else {
        return real.replace.call(this, search, function () {
            var args = arguments;
            return real.replace.call(replacement, lib.replaceVar, function ($0, $1, $2) {
                // numbered backreference or special variable
                if ($1) {
                    switch ($1) {
                        case "$": return "$";
                        case "&": return args[0];
                        case "`": return args[args.length - 1].slice(0, args[args.length - 2]);
                        case "'": return args[args.length - 1].slice(args[args.length - 2] + args[0].length);
                        // numbered backreference
                        default:
                            /* what does "$10" mean?
                                - backreference 10, if 10 or more capturing groups exist
                                - backreference 1 followed by "0", if 1-9 capturing groups exist
                                - otherwise, it's the string "$10"
                            */
                            var literalNumbers = "";
                            $1 = +$1; // type-convert
                            while ($1 > captureNames.length) {
                                literalNumbers = real.split.call($1, "").pop() + literalNumbers;
                                $1 = Math.floor($1 / 10); // drop the last digit
                            }
                            return ($1 ? args[$1] : "$") + literalNumbers;
                    }
                // named backreference
                } else if ($2) {
                    /* what does "${name}" mean?
                        - backreference to named capture "name", if it exists
                        - otherwise, it's the string "${name}"
                    */
                    var index = indexOf(captureNames, $2);
                    return index > -1 ? args[index + 1] : $0;
                } else {
                    return $0;
                }
            });
        });
    }
};

/*** String.prototype.split
    a consistent cross-browser, ECMA-262 v3 compliant split method
*/
String.prototype.split = function (s /* separator */, limit) {
    // if separator is not a regex, use the native split method
    if (!(s instanceof RegExp))
        return real.split.apply(this, arguments);

    var output = [],
        origLastIndex = s.lastIndex,
        lastLastIndex = 0,
        i = 0, match, lastLength;

    /* behavior for limit: if it's...
        - undefined: no limit
        - NaN or zero: return an empty array
        - a positive number: use limit after dropping any decimal
        - a negative number: no limit
        - other: type-convert, then use the above rules
    */
    if (limit === undefined || +limit < 0) {
        limit = false;
    } else {
        limit = Math.floor(+limit);
        if (!limit)
            return [];
    }

    if (s.global)
        s.lastIndex = 0;
    else
        s = s.addFlags("g");

    while ((!limit || i++ <= limit) && (match = s.exec(this))) { // run the altered exec!
        if (s.lastIndex > lastLastIndex) {
            output = output.concat(this.slice(lastLastIndex, match.index));
            if (1 < match.length && match.index < this.length)
                output = output.concat(match.slice(1));
            lastLength = match[0].length; // only needed if s.lastIndex === this.length
            lastLastIndex = s.lastIndex;
        }
        if (!match[0].length)
            s.lastIndex++; // avoid an infinite loop
    }

    // since this uses test(), output must be generated before restoring lastIndex
    output = lastLastIndex === this.length ?
        (s.test("") && !lastLength ? output : output.concat("")) :
        (limit ? output : output.concat(this.slice(lastLastIndex)));
    s.lastIndex = origLastIndex; // only needed if s.global, else we're working with a copy of the regex
    return output;
};

// intentionally undocumented
RegExp.prototype.getNativeFlags = function () {
    return (this.global     ? "g" : "") +
           (this.ignoreCase ? "i" : "") +
           (this.multiline  ? "m" : "") +
           (this.extended   ? "x" : "") +
           (this.sticky     ? "y" : "");
};

/*** RegExp.prototype.addFlags
    accepts flags; returns a new XRegExp object generated by recompiling
    the regex with the additional flags (may include non-native flags).
    the original regex object is not altered.
*/
RegExp.prototype.addFlags = function (flags) {
    var regex = new XRegExp(this.source, (flags || "") + this.getNativeFlags());
    if (this._x) {
        regex._x = {
            source:       this._x.source,
            captureNames: this._x.captureNames ? this._x.captureNames.slice(0) : null
        };
    }
    return regex;
};

/*** RegExp.prototype.call
    accepts a context object and string; returns the result of calling
    ``exec`` with the provided string. the context is ignored but is
    accepted for congruity with ``Function.prototype.call``.
*/
RegExp.prototype.call = function (context, str) {
    return this.exec(str);
};

/*** RegExp.prototype.apply
    accepts a context object and arguments array; returns the result of
    calling ``exec`` with the first value in the arguments array. the context
    is ignored but is accepted for congruity with ``Function.prototype.apply``.
*/
RegExp.prototype.apply = function (context, args) {
    return this.exec(args[0]);
};

/*** XRegExp.cache
    accepts a pattern and flags; returns an XRegExp object. if the pattern
    and flag combination has previously been cached, the cached copy is
    returned, otherwise the new object is cached.
*/
XRegExp.cache = function (pattern, flags) {
    var key = "/" + pattern + "/" + (flags || "");
    return XRegExp.cache[key] || (XRegExp.cache[key] = new XRegExp(pattern, flags));
};

/*** XRegExp.escape
    accepts a string; returns the string with regex metacharacters escaped.
    the returned string can safely be used within a regex to match a literal
    string. escaped characters are [, ], {, }, (, ), -, *, +, ?, ., \, ^, $,
    |, #, [comma], and whitespace.
*/
XRegExp.escape = function (str) {
    return str.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&");
};

/*** XRegExp.matchRecursive
    accepts a string to search, left and right delimiters as regex pattern
    strings, optional regex flags (may include non-native s, x, and y flags),
    and an options object which allows setting an escape character and changing
    the return format from an array of matches to a two-dimensional array of
    string parts with extended position data. returns an array of matches
    (optionally with extended data), allowing nested instances of left and right
    delimiters. use the g flag to return all matches, otherwise only the first
    is returned. if delimiters are unbalanced within the subject data, an error
    is thrown.

    this function admittedly pushes the boundaries of what can be accomplished
    sensibly without a "real" parser. however, by doing so it provides flexible
    and powerful recursive parsing capabilities with minimal code weight.

    warning: the ``escapeChar`` option is considered experimental and might be
    changed or removed in future versions of XRegExp.

    unsupported features:
     - backreferences within delimiter patterns when using ``escapeChar``.
     - although providing delimiters as regex objects adds the minor feature of
       independent delimiter flags, it introduces other limitations and is only
       intended to be done by the ``XRegExp`` constructor (which can't call
       itself while building a regex).
*/
XRegExp.matchRecursive = function (str, left, right, flags, options) {
    var options      = options || {},
        escapeChar   = options.escapeChar,
        vN           = options.valueNames,
        flags        = flags || "",
        global       = flags.indexOf("g") > -1,
        ignoreCase   = flags.indexOf("i") > -1,
        multiline    = flags.indexOf("m") > -1,
        sticky       = flags.indexOf("y") > -1,
        /* sticky mode has its own handling in this function, which means you
           can use flag "y" even in browsers which don't support it natively */
        flags        = flags.replace(/y/g, ""),
        left         = left  instanceof RegExp ? (left.global  ? left  : left.addFlags("g"))  : new XRegExp(left,  "g" + flags),
        right        = right instanceof RegExp ? (right.global ? right : right.addFlags("g")) : new XRegExp(right, "g" + flags),
        output       = [],
        openTokens   = 0,
        delimStart   = 0,
        delimEnd     = 0,
        lastOuterEnd = 0,
        outerStart, innerStart, leftMatch, rightMatch, escaped, esc;

    if (escapeChar) {
        if (escapeChar.length > 1) throw SyntaxError("can't supply more than one escape character");
        if (multiline)             throw TypeError("can't supply escape character when using the multiline flag");
        escaped = XRegExp.escape(escapeChar);
        /* Escape pattern modifiers:
            /g - not needed here
            /i - included
            /m - **unsupported**, throws error
            /s - handled by XRegExp when delimiters are provided as strings
            /x - handled by XRegExp when delimiters are provided as strings
            /y - not needed here; supported by other handling in this function
        */
        esc = new RegExp(
            "^(?:" + escaped + "[\\S\\s]|(?:(?!" + left.source + "|" + right.source + ")[^" + escaped + "])+)+",
            ignoreCase ? "i" : ""
        );
    }

    while (true) {
        /* advance the starting search position to the end of the last delimiter match.
           a couple special cases are also covered:
            - if using an escape character, advance to the next delimiter's starting position,
              skipping any escaped characters
            - first time through, reset lastIndex in case delimiters were provided as regexes
        */
        left.lastIndex = right.lastIndex = delimEnd +
            (escapeChar ? (esc.exec(str.slice(delimEnd)) || [""])[0].length : 0);

        leftMatch  = left.exec(str);
        rightMatch = right.exec(str);

        // only keep the result which matched earlier in the string
        if (leftMatch && rightMatch) {
            if (leftMatch.index <= rightMatch.index)
                 rightMatch = null;
            else leftMatch  = null;
        }

        /* paths*:
        leftMatch | rightMatch | openTokens | result
        1         | 0          | 1          | ...
        1         | 0          | 0          | ...
        0         | 1          | 1          | ...
        0         | 1          | 0          | throw
        0         | 0          | 1          | throw
        0         | 0          | 0          | break
        * - does not include the sticky mode special case
          - the loop ends after the first completed match if not in global mode
        */

        if (leftMatch || rightMatch) {
            delimStart = (leftMatch || rightMatch).index;
            delimEnd   = (leftMatch ? left : right).lastIndex;
        } else if (!openTokens) {
            break;
        }

        if (sticky && !openTokens && delimStart > lastOuterEnd)
            break;

        if (leftMatch) {
            if (!openTokens++) {
                outerStart = delimStart;
                innerStart = delimEnd;
            }
        } else if (rightMatch && openTokens) {
            if (!--openTokens) {
                if (vN) {
                    if (vN[0] && outerStart > lastOuterEnd)
                               output.push([vN[0], str.slice(lastOuterEnd, outerStart), lastOuterEnd, outerStart]);
                    if (vN[1]) output.push([vN[1], str.slice(outerStart,   innerStart), outerStart,   innerStart]);
                    if (vN[2]) output.push([vN[2], str.slice(innerStart,   delimStart), innerStart,   delimStart]);
                    if (vN[3]) output.push([vN[3], str.slice(delimStart,   delimEnd),   delimStart,   delimEnd]);
                } else {
                    output.push(str.slice(innerStart, delimStart));
                }
                lastOuterEnd = delimEnd;
                if (!global)
                    break;
            }
        } else {
            // reset lastIndex in case delimiters were provided as regexes
            left.lastIndex = right.lastIndex = 0;
            throw Error("subject data contains unbalanced delimiters");
        }

        // if the delimiter matched an empty string, advance delimEnd to avoid an infinite loop
        if (delimStart === delimEnd)
            delimEnd++;
    }

    if (global && !sticky && vN && vN[0] && str.length > lastOuterEnd)
        output.push([vN[0], str.slice(lastOuterEnd), lastOuterEnd, str.length]);

    // reset lastIndex in case delimiters were provided as regexes
    left.lastIndex = right.lastIndex = 0;

    return output;
};

