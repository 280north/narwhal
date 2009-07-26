
// NOTE: portions of the "file" module are implemented in "file-bootstrap" and "file-platform",
// which are loaded at the bottom of this file to allow for overriding default implementations

var io = require('io');

/* streams */

exports.open = function (path, mode, options) {

    // it's possible to confuse options and mode,
    // particularly with exports.read(path, options).
    // if a mode string is passed into options, 
    // tollerate it.
    if (typeof options == 'string') {
        options = {
            mode: exports.mode(options)
        }
    }

    // we'll channel all of the arguments through
    // the options object, so create an empty one if none
    // was given.
    if (!options) 
        options = {};

    // if options were specified as the first (and
    // presumably only) argument, use those options,
    // overriding any in the options object if both
    // were provided.
    if (typeof path == 'object') {
        for (var key in path) {
            if (Object.prototype.hasOwnProperty.call(path, key)) {
                options[key] = path[key];
            }
        }
    }
    // if the path is a string, however, write it
    // onto the options object alone.
    if (typeof path == 'string')
        options.path = path;

    // accumulate the mode from options.mode and 
    // the mode arg through successive generations;
    // coerce the options.mode to an object, suitable
    // for updates
    options.mode = exports.mode(options.mode);
    // update options.mode with the mode argument
    if (mode)
        options.mode = exports.mode(mode, options.mode);


    // channel all the options back into local variables
    path = options.path;
    mode = options.mode;
    var permissions = options.permissions,
        charset = options.charset,
        buffering = options.buffering,
        recordSeparator = options.recordSeparator,
        fieldSeparator = options.fieldSeparator;

    // and decompose the mode object
    var read = mode.read,
        write = mode.write,
        append = mode.append,
        update = mode.update,
        binary = mode.binary;

    // read by default
    if (!(read || write || append))
        read = mode.read = true;

    // create a byte stream
    var raw = exports.FileIO(path, mode, permissions);

    // if we're in binary mode, just return the raw
    // stream
    if (binary)
        return raw;

    // otherwise, go through the courses to return the
    // appropriate reader, writer, or updater, buffered,
    // line buffered, and charset decoded/encoded
    // abstraction

    var lineBuffering = buffering == 1 || buffering === undefined && raw.isatty && raw.isatty();
    // leaving buffering undefined is a signal to the platform implementation
    //  that it ought to pick a good size on its own.
    if (buffering < 0) {
        throw new Error("invalid buffering size");
    }
    if (buffering === 0) {
        throw new Error("can't have unbuffered text IO");
    }

    return new io.TextIOWrapper(raw, mode, lineBuffering, buffering, charset, options);

};

/*
    idempotent normalization of acceptable formats for
    file modes.
*/
exports.mode = function (mode, result) {
    if (!result)
        result = {
            read: false,
            write: false,
            append: false,
            update: false,
            binary: false,
            canonical: false,
            exclusive: false
        };
    else if (typeof result != 'object')
        throw new Error("Mode to update is not a proper mode object: " + result);

    if (mode === undefined || mode === null) {
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
            } else if (option == 'b') {
                result.binary = true;
            } else if (option == 't') {
                result.binary = false;
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
    path = String(path);
    var file = exports.open(path, 'r', options);
    try {
        return file.read();
    } finally {
        file.close();
    }
};

exports.write = function (path, data, options) {
    path = String(path);
    var file = exports.open(path, 'w', options);
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
    path = String(path);
    if (!path)
        path = ".";
    return implementation.list(path);
};

exports.listTree = function (path) {
    path = String(path);
    var paths = [path];
    if (exports.isDirectory(path)) {
        exports.list(path).forEach(function (child) {
            paths.push.apply(
                paths,
                exports.listTree(exports.join(path, child))
            );
        });
    }
    return paths;
};

exports.glob = function (pattern) {
    pattern = String(pattern);
    pattern = pattern.replace(/\*\*/g, '*/**/*');
    var parts = exports.split(pattern);
    var paths = [''];
    parts.forEach(function (part) {

        if (part == "") {
        } else if (part == "**") {
            paths = Array.prototype.concat.apply(
                [],
                paths.map(function (path) {
                    return exports.listTree(path);
                })
            );
        } else if (/[\*\?]/.test(part)) {
            var pattern = new RegExp('^'+
                part.split('*').map(function (part) {
                    return part.split('?').map(function (part) {
                        return RegExp.escape(part);
                    }).join('.');
                }).join('.*?')
            +'$');
            paths = Array.prototype.concat.apply([], paths.map(function (path) {
                if (path != "" && !exports.isDirectory(path))
                    return [];
                return exports.list(path).filter(function (name) {
                    return pattern.test(name);
                }).map(function (name) {
                    return exports.join(path, name);
                }).filter(function (path) {
                    return exports.exists(path);
                });
            }));
        } else if (part == "...") {
            paths = Array.prototype.concat.apply(
                [],
                paths.map(function (path) {
                    var heredity = [];
                    var parts = exports.split(exports.absolute(path));
                    while (parts.length) {
                        heredity.push(exports.join.apply(null, parts));
                        parts.pop();
                    }
                    return heredity;
                })
            );
        } else {
            paths = paths.map(function (path) {
                return exports.join(path, part);
            });
        }

        // uniqueness
        var visited = {};
        paths = paths.filter(function (path) {
            var result = !Object.prototype.hasOwnProperty.call(visited, path);
            visited[path] = true;
            return result;
        });

    });
    return paths;
};

exports.rmtree = function(path) {
    if (exports.isDirectory(path)) {
        exports.list(path).forEach(function (name) {
            exports.rmtree(exports.join(path, name));
        });
        exports.rmdir(path);
    } else {
        exports.remove(path);
    }
};

/* path manipulation */

exports.relative = function (source, target) {
    if (!target) {
        target = source;
        source = exports.cwd() + '/';
    }
    source = exports.absolute(source);
    target = exports.absolute(target);
    source = source.split(exports.SEPARATORS_RE());
    target = target.split(exports.SEPARATORS_RE());
    source.pop();
    while (
        source.length &&
        target.length &&
        target[0] == source[0]) {
        source.shift();
        target.shift();
    }
    while (source.length) {
        source.shift();
        target.unshift("..");
    }
    return target.join(exports.SEPARATORS_RE());
};

exports.absolute = function (path) {
    return exports.resolve(exports.join(exports.cwd(), ''), path);
};

/* path wrapper, for chaining */

exports.path = function (/*path*/) {
    return exports.Path(exports.join.apply(exports, arguments));
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
    );
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

Path.prototype.listPaths = function () {
    var self = this;
    return exports.list(this).map(function (name) {
        return self.join(name);
    });
};

var pathed = [
    'absolute',
    'basename',
    'canonical',
    'dirname',
    'normal',
    'relative'
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
    'chmod',
    'chown',
    'copy',
    'exists',
    'extname',
    'isDirectory',
    'isFile',
    'isLink',
    'isReadable',
    'isWritable',
    'link',
    'linkExists',
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
    'symlink',
    'touch',
    'write'
];

for (var i = 0; i < trivia.length; i++) {
    var name = trivia[i];
    Path.prototype[name] = (function (name) {
        return function () {
            var result = exports[name].apply(
                this,
                [this.toString()].concat(Array.prototype.slice.call(arguments))
            );
            if (result === undefined)
                result = this;
            return result;
        };
    })(name);
}

// load "file-bootstrap" and "file-platform", which in turn load "file" and modify it's module object.
// "platform" gets priority so it's loaded last.
require("file-bootstrap");
require("file-platform");
