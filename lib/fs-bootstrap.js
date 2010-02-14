
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson

// NOTE: this file is used is the bootstrapping process,
// so any "requires" must be accounted for in narwhal.js

var SYSTEM = require("system");

/* path manipulation, needed by the sandbox module in the 
 * bootstrapping process before "require" is ready for use */

if (/\bwindows\b/i.test(SYSTEM.os) || /\bwinnt\b/i.test(SYSTEM.os)) {
    exports.ROOT = "\\";
    exports.SEPARATOR = "\\";
    exports.ALT_SEPARATOR = "/";
} else {
    exports.ROOT = "/";
    exports.SEPARATOR = "/";
    exports.ALT_SEPARATOR = undefined;
}

// we need to make sure the separator regex is always in sync with the separators.
// this caches the generated regex and rebuild if either separator changes.
exports.SEPARATORS_RE = function() {
    if (
        separatorCached !== exports.SEPARATOR ||
        altSeparatorCached !== exports.ALT_SEPARATOR
    ) {
        separatorCached = exports.SEPARATOR;
        altSeparatorCached = exports.ALT_SEPARATOR;
        separatorReCached = new RegExp("[" +
            (separatorCached || '').replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&") +
            (altSeparatorCached || '').replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&") +
        "]", "g");
    }
    return separatorReCached;
}
var separatorCached, altSeparatorCached, separatorReCached;

exports.join = function () {
    // special case for root, helps glob
    if (arguments.length == 1 && arguments[0] == "")
        return exports.SEPARATOR; // [""] -> "/"
    // ["", ""] -> "/",
    // ["", "a"] -> "/a"
    // ["a"] -> "a"
    return exports.normal(Array.prototype.join.call(arguments, exports.SEPARATOR));
};

exports.split = function (path) {
    var parts;
    try {
        parts = String(path).split(exports.SEPARATORS_RE());
    } catch (exception) {
        throw new Error("Cannot split " + (typeof path) + ', "' + path + '"');
    }
    // this special case helps isAbsolute
    // distinguish an empty path from an absolute path
    // "" -> [] NOT [""]
    if (parts.length == 1 && parts[0] == "")
        return [];
    // "a" -> ["a"]
    // "/a" -> ["", "a"]
    return parts;
};

exports.resolve = function () {
    var root = "";
    var parents = [];
    var children = [];
    var leaf = "";
    for (var i = 0; i < arguments.length; i++) {
        var path = String(arguments[i]);
        if (path == "")
            continue;
        var parts = path.split(exports.SEPARATORS_RE());
        if (exports.isAbsolute(path)) {
            root = parts.shift() + exports.SEPARATOR;
            parents = [];
            children = [];
        }
        leaf = parts.pop();
        if (leaf == "." || leaf == "..") {
            parts.push(leaf);
            leaf = "";
        }
        for (var j = 0; j < parts.length; j++) {
            var part = parts[j];
            if (part == "." || part == '') {
            } else if (part == "..") {
                if (children.length) {
                    children.pop();
                } else {
                    if (root) {
                    } else {
                        parents.push("..");
                    }
                }
            } else {
                children.push(part);
            }
        };
    }
    path = parents.concat(children).join(exports.SEPARATOR);
    if (path) leaf = exports.SEPARATOR + leaf;
    return root + path + leaf;
};

exports.normal = function (path) {
    return exports.resolve(path);
};

// XXX not standard
exports.isAbsolute = function (path) {
    // for absolute paths on any operating system,
    // the first path component always determines
    // whether it is relative or absolute.  On Unix,
    // it is empty, so ['', 'foo'].join('/') == '/foo',
    // '/foo'.split('/') == ['', 'foo'].
    var parts = exports.split(path);
    // split('') == [].  '' is not absolute.
    // split('/') == ['', ''] is absolute.
    // split(?) == [''] does not occur.
    if (parts.length == 0)
        return false;
    return exports.isDrive(parts[0]);
};

// XXX not standard
exports.isRelative = function (path) {
    return !exports.isAbsolute(path);
};

// XXX not standard
exports.isDrive = function (first) {
    if (/\bwindows\b/i.test(SYSTEM.os) || /\bwinnt\b/i.test(SYSTEM.os)) {
        return /:$/.test(first);
    } else {
        return first == "";
    }
};

/**
    returns the Unix root path or corresponding Windows drive for a given path.
*/
// XXX not standard
exports.root = function (path) {
    if (!exports.isAbsolute(path))
        path = require("file").absolute(path);
    var parts = exports.split(path);
    return exports.join(parts[0], '');
};

exports.directory = function (path) {
    var parts = exports.split(path);
    // XXX needs to be sensitive to the root for
    // Windows compatibility
    parts.pop();
    return exports.join.apply(null, parts) || ".";
};

exports.base = function (path, extension) {
    var basename = path.split(exports.SEPARATORS_RE()).pop();
    if (extension)
        basename = basename.replace(
            new RegExp(RegExp.escape(extension) + '$'),
            ''
        );
    return basename;
};

exports.extension = function (path) {
    path = exports.basename(path);
    path = path.replace(/^\.*/, '');
    var index = path.lastIndexOf(".");
    return index <= 0 ? "" : path.substring(index);
};

