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
    var root = "";
    var parents = [];
    var children = [];
    var leaf = "";
    for (var i = 0; i < arguments.length; i++) {
        var path = String(arguments[i]);
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

exports.normal = function (path) {
    return exports.join(path);
};

exports.absolute = function (path) {
    return exports.join(exports.cwd() + "/", path);
};

