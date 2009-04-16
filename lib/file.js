
var implementation = require('file-platform');

for (var name in implementation) {
    if (Object.prototype.hasOwnProperty.call(implementation, name)) {
        exports[name] = implementation[name];
    }
}

/* reading, writing, &c */

exports.read = function (/* open arguments */) {
    var file = exports.open.apply(null, arguments);
    try {
        return file.read();
    } finally {
        file.close();
    }
};

exports.write = function (path, data, options) {
    var file = exports.open(path, 'w', undefined, undefined, options);
    try {
        file.write(data);
        file.flush();
    } finally {
        file.close();
    }
};

exports.copy = function (source, target) {
    source = exports.path(source);
    target = exports.path(target);
    var data = source.read();
    target.write(data);
};

/* path manipulation */

exports.SEPARATOR = implementation.SEPARATOR;
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

exports.extname = function(path) {
    var index = path.lastIndexOf(".");
    return index <= 0 ? "" : path.substring(index);
};

/* path wrapper, for chaining */

exports.path = function (path) {
    return exports.Path(path);
};

var Path = exports.Path = function (path) {
    if (!(this instanceof exports.Path))
        return new exports.Path(path);
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

Path.prototype.to = function (target) {
    return exports.Path(exports.relative(this.path, target));
};

Path.prototype.from = function (target) {
    return exports.Path(exports.relative(target, this.path));
};

var pathed = [
    'absolute',
    'basename',
    'canonical',
    'dirname',
    'move',
    'normal',
    'rename'
];

for (var i = 0; i < pathed.length; i++) {
    var name = pathed[i];
    Path.prototype[name] = (function (name) {
        return function () {
            return exports[name].apply(
                this,
                [this.path].concat(Array.prototype.slice.call(arguments))
            );
        };
    })(name);
}

var trivia = [
    'exists',
    'extname',
    'isDirectory',
    'isFile',
    'isLink',
    'isReadable',
    'isWritable',
    'list',
    'mkdir', 
    'mkdirs',
    'mtime',
    'read',
    'remove',
    'rmdir',
    'rmtree',
    'size',
    'split',
    'stat',
    'touch',
    'write'
];

for (var i = 0; i < trivia.length; i++) {
    var name = trivia[i];
    Path.prototype[name] = (function (name) {
        return function () {
            return exports[name].apply(
                this,
                [this.path].concat(Array.prototype.slice.call(arguments))
            );
        };
    })(name);
}

