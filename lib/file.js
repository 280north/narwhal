// File: platform independent

var File = exports.File = require("platform/file").File;

File.SEPARATOR = "/";

File.dirname = function(path) {
    var raw = String(path),
        match = raw.match(/^(.*)\/[^\/]+\/?$/);
    if (match && match[1])
        return match[1]
    else if (raw.charAt(0) == "/")
        return "/"
    else
        return "."
}

File.extname = function(path) {
    var index = path.lastIndexOf(".");
    return index < 0 ? "" : path.substring(index);
}

File.join = function() {
    return Array.prototype.join.apply(arguments, [File.SEPARATOR]);
}

File.canonicalize = function(path) {
    return path.replace(/[^\/]+\/\.\.\//g, "").replace(/([^\.])\.\//g, "$1").replace(/^\.\//g, "").replace(/\/\/+/g, "/");
}

File.read = function(path) {
    var f = new File(path, "r");
    try { return f.read.apply(f, Array.prototype.slice.call(arguments, 1)); } finally { f.close(); }
}

File.size = function(path) {
    var f = new File(path);
    try { return f.size(); } finally { f.close(); }
}

File.isReadable = function(path) {
    var f = new File(path);
    try { return f.isReadable(); } finally { f.close(); }
}

File.isWritable = function(path) {
    var f = new File(path);
    try { return f.isWritable(); } finally { f.close(); }
}

File.mtime = function(path) {
    var f = new File(path);
    try { return f.mtime(); } finally { f.close(); }
}

File.exists = function (path) {
    var f = new File(path);
    try { return f.exists(); } finally { f.close(); }
};


/* here begins tier 1 file api draft prototype  */

var implementation = require('platform/file');

for (name in implementation) {
    if (Object.prototype.hasOwnProperty.call(implementation, name)) {
        exports[name] = implementation[name];
    }
}

exports.SEPARATOR = "/";
exports.PARENT = "..";
exports.SELF = ".";
exports.ROOT = "/";

exports.join = function () {
    return Array.prototype.join.apply(arguments, [exports.SEPARATOR]);
};

exports.split = function (path) {
    return String(path).split(exports.SEPARATOR);
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
        if (leaf == exports.SELF || leaf == exports.PARENT) {
            parts.push(leaf);
            leaf = "";
        }
        for (var j = 0; j < parts.length; j++) {
            var part = parts[j];
            if (part == exports.SELF || part == '') {
            } else if (part == exports.PARENT) {
                if (children.length) {
                    children.pop();
                } else {
                    if (root) {
                    } else {
                        parents.push(exports.PARENT);
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

exports.relative = function (source, target) {
    source = exports.absolute(source);
    target = exports.absolute(target);
    source = source.split(exports.SEPARATOR);
    target = target.split(exports.SEPARATOR);
    if (source[source.length - 1] == "")
        source.pop();
    while (source.length && target.length && target[0] == source[0]) {
        source.shift();
        target.shift();
    }
    while (source.length) {
        source.shift();
        target.unshift('..');
    }
    return target.join(exports.SEPARATOR);
};

exports.normal = function (path) {
    return exports.resolve(path);
};

exports.absolute = function (path) {
    return exports.resolve(exports.cwd() + "/", path);
};

exports.dirname = function (path) {
    return exports.resolve(path, '.');
};

exports.basename = function (path) {
    return path.split(exports.SEPARATOR).pop();
};

exports.list = function (path) {
    return implementation.list(String(path));
};

/* path wrapper, for chaining */

exports.path = function (path) {
    return exports.Path(path);
};

var Path = exports.Path = function (path) {
    if (!(this instanceof exports.Path)) {
        return new exports.Path(path);
    }
    this.path = String(path);
};

Path.prototype = new String();

Path.prototype.toString = function () {
    return this.path;
};

Path.prototype.valueOf = function () {
    return this.path;
};

Path.prototype.join = function () {
    return exports.Path(
        exports.join.apply(
            null,
            [this.path].concat(Array.prototype.slice.call(arguments))
        )
    );
};

Path.prototype.split = function () {
    return exports.split(this.path);
};

Path.prototype.resolve = function () {
    return exports.Path(
        exports.resolve.apply(
            null,
            [this.path].concat(Array.prototype.slice.call(arguments))
        )
    );
};

Path.prototype.relative = function (target) {
    return exports.Path(exports.relative(this.path, target));
};

Path.prototype.absolute = function () {
    return exports.Path(exports.absolute(this.path));
};

Path.prototype.normal = function () {
    return exports.Path(exports.normal(this.path));
};

Path.prototype.canonical = function () {
    return exports.Path(exports.canonical(this.path));
};

Path.prototype.basename = function () {
    return exports.Path(exports.basename(this.path));
};

Path.prototype.dirname = function () {
    return exports.Path(exports.dirname(this.path));
};

/*
    If you resolve a path relative to a path that's
    leaf is a directory, the path will be resolved
    relative to that directory's parent.  So, this
    function resolves into the contents of the directory,
    with no leaf.
*/
Path.prototype.directory = function () {
    return exports.Path(exports.path(this.path + '/'));
};

Path.prototype.isDirectory = function () {
    return exports.isDirectory(this.path);
};

Path.prototype.isLink = function () {
    return exports.isLink(this.path);
};

Path.prototype.list = function () {
    var list = implementation.list(this.path);
    for (var i = 0; i < list.length; i++)
        list[i] = exports.Path(list[i]);
    return list;
};

