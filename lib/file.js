
var io = require('io');
var implementation = require('file-platform');

for (var name in implementation) {
    if (Object.prototype.hasOwnProperty.call(implementation, name)) {
        exports[name] = implementation[name];
    }
}

/* streams */

exports.open = function (path, mode, options) {

    if (typeof path != 'string' && arguments.length == 1) {
        options = path;
        path = options.path;
        mode = options.mode;
    }

    if (!options) 
        options = {};

    var mode = exports.mode(mode),
        read = mode.read,
        write = mode.write,
        append = mode.append,
        update = mode.update;
    var permissions = options.permissions,
        encoding = options.encoding,
        buffering = options.buffering,
        recordSeparator = options.recordSeparator,
        fieldSeparator = options.fieldSeparator;

    var raw = exports.FileIO(path, mode, permissions);

    if (encoding === undefined)
        return raw;

    var lineBuffering = buffering == 1 || buffering === undefined && raw.isatty();
    // leaving buffering undefined is a signal to the platform implementation
    //  that it ought to pick a good size on its own.
    if (buffering < 0) {
        throw new Error("invalid buffering size");
    }
    if (buffering === 0) {
        throw new Error("can't have unbuffered text IO");
    }
    if (encoding === undefined) {
        throw new Error("encoding must not be binary to buffer.");
    }

    return new io.TextIOWrapper(raw, mode, lineBuffering, buffering, encoding, options);

};

/*
    idempotent normalization of acceptable formats for
    file modes.
*/
exports.mode = function (mode) {
    var result = {
        read: false,
        write: false,
        append: false,
        update: false,
        canonical: false,
        exclusive: false
    };

    if (mode === undefined || mode === null) {
        result.read = true;
    } else if (mode instanceof String || typeof mode == "string") {
        mode.split("").forEach(function (option) {
            if (option == 'r') {
                result.read = true;
            } else if (option == 'w') {
                result.write = true;
            } else if (option == 'a') {
                result.append = true;
            } else if (option == '+') {
                result.update = false;
            } else if (option == 'c') {
                result.canonical = true;
            } else if (option == 'x') {
                result.exclusive = true;
            } else {
                throw new Error("unrecognized mode option in mode: " + option);
            }
        });
    } else if (mode instanceof Array) {
        mode.forEach(function (option) {
            if (Object.prototype.hasOwnProperty.call(result, option)) {
                result[option] = true;
            } else {
                throw new Error("unrecognized mode option in mode: " + option);
            }
        });
    } else if (mode instanceof Object) {
        for (var option in mode) {
            if (Object.prototype.hasOwnProperty.call(mode, option)) {
                if (Object.prototype.hasOwnProperty.call(result, option)) {
                    result[option] = !!mode[option];
                } else {
                    throw new Error("unrecognized mode option in mode: " + option);
                }
            }
        }
    } else {
        throw new Error("unrecognized mode: " + mode);
    }

    return result;
};

/* read, write, &c */

exports.read = function (path, options) {
    var file = exports.open(path, 'r', options);
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

exports.list = function (path) {
    if (!path)
        path = ".";
    return implementation.list(path);
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
    this.toString = function () {
        return path;
    };
};

Path.prototype = new String();

Path.prototype.valueOf = function () {
    return this.toString();
};

Path.prototype.join = function () {
    return exports.Path(
        exports.join.apply(
            null,
            [this.toString()].concat(Array.prototype.slice.call(arguments))
        )
    ).normal();
};

Path.prototype.split = function () {
    return exports.split(this.toString());
};

Path.prototype.resolve = function () {
    return exports.Path(
        exports.resolve.apply(
            null,
            [this.toString()].concat(Array.prototype.slice.call(arguments))
        )
    );
};

Path.prototype.to = function (target) {
    return exports.Path(exports.relative(this.toString(), target));
};

Path.prototype.from = function (target) {
    return exports.Path(exports.relative(target, this.toString()));
};

var pathed = [
    'absolute',
    'basename',
    'canonical',
    'dirname',
    'normal'
];

for (var i = 0; i < pathed.length; i++) {
    var name = pathed[i];
    Path.prototype[name] = (function (name) {
        return function () {
            return exports.Path(exports[name].apply(
                this,
                [this.toString()].concat(Array.prototype.slice.call(arguments))
            ));
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
    'move',
    'mtime',
    'open',
    'read',
    'remove',
    'rename',
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
                [this.toString()].concat(Array.prototype.slice.call(arguments))
            );
        };
    })(name);
}

