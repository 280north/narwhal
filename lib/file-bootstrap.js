/* path manipulation */

// defaults to be overrided by file module or bootstrapper
exports.ROOT = "/";
exports.SEPARATOR = "/";
exports.ALT_SEPARATOR = undefined;

exports.join = function () {
    return exports.normal(Array.prototype.join.call(arguments, exports.SEPARATOR));
};

exports.split = function (path) {
    var SEPARATORS_RE = new RegExp(
        "[" +
            RegExp.escape(exports.SEPARATOR || '') + 
            RegExp.escape(exports.ALT_SEPARATOR || '') + 
        "]"
    );
    
    try {
        return String(path).split(SEPARATORS_RE);
    } catch (exception) {
        throw new Error("Cannot split " + (typeof path) + ', "' + path + '"');
    }
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
        if (path.charAt(0) == exports.SEPARATOR) {
            path = path.substring(1, path.length);
            root = exports.ROOT;
            parents = [];
            children = [];
        }
        var parts = path.split(exports.SEPARATOR);
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
    // XXX not windows compatible
    return /^\//.test(path);
};

// XXX not standard
exports.isRelative = function (path) {
    return !exports.isAbsolute(path);
};

exports.dirname = function (path) {
    var parts = exports.split(path);
    // XXX needs to be sensitive to the root for
    // Windows compatibility
    parts.pop();
    return exports.join.apply(null, parts) || ".";
};

exports.basename = function (path) {
    return path.split(exports.SEPARATOR).pop();
};

exports.extension = function (path) {
    path = exports.basename(path);
    path = path.replace(/^\.*/, '');
    var index = path.lastIndexOf(".");
    return index <= 0 ? "" : path.substring(index);
};

exports.extname = function (path) {
    system.log.warn('extname is deprecated in favor of extension');
    return exports.extension(path);
};
