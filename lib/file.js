
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson
// -- tolmasky Francisco Tolmasky
// -- dangoor Kevin Dangoor

// NOTE: portions of the "file" module are implemented in "file-bootstrap" and "file-engine",
// which are loaded at the bottom of this file to allow for overriding default implementations

var io = require('io');

require("file-bootstrap");

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
    // leaving buffering undefined is a signal to the engine implementation
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
    source.open("rb").copy(target.open("wb")).close();
};

var list = exports.list;
exports.list = function (path) {
    return list(String(path || '') || ".");
};

exports.listTree = function (path) {
    path = String(path || '');
    if (!path)
        path = ".";
    var paths = [""];
    exports.list(path).forEach(function (child) {
        var fullPath = exports.join(path, child);
        if (exports.isDirectory(fullPath)) {
            paths.push.apply(paths, exports.listTree(fullPath).map(function(p) {
                return exports.join(child, p);
            }));
        } else {
            paths.push(child)
        }
    });
    return paths;
};

exports.listDirectoryTree = function (path) {
    path = String(path || '');
    if (!path)
        path = ".";
    var paths = [""];
    exports.list(path).forEach(function (child) {
        var fullPath = exports.join(path, child);
        if (exports.isDirectory(fullPath)) {
            paths.push.apply(paths, exports.listDirectoryTree(fullPath).map(function(p) {
                return exports.join(child, p);
            }));
        }
    });
    return paths;
};

exports.FNM_LEADING_DIR = 1 << 1;
exports.FNM_PATHNAME    = 1 << 2;
exports.FNM_PERIOD      = 1 << 3;
exports.FNM_NOESCAPE    = 1 << 4;
exports.FNM_CASEFOLD    = 1 << 5;
exports.FNM_DOTMATCH    = 1 << 6;

var fnmatchFlags = ["FNM_LEADING_DIR","FNM_PATHNAME","FNM_PERIOD","FNM_NOESCAPE","FNM_CASEFOLD","FNM_DOTMATCH"];

exports.fnmatch = function (pattern, string, flags) {
    var re = exports.patternToRegExp(pattern, flags);
    //print("PATTERN={"+pattern+"} REGEXP={"+re+"}");
    return re.test(string);
}

exports.patternToRegExp = function (pattern, flags) {
    var options = {};
    if (typeof flags === "number") {
        fnmatchFlags.forEach(function(flagName) {
            options[flagName] = !!(flags & exports[flagName]);
        });
    } else if (flags) {
        options = flags;
    }
    
    // FNM_PATHNAME: don't match separators
    var matchAny = options.FNM_PATHNAME ? "[^"+RegExp.escape(exports.SEPARATOR)+"]" : ".";
    
    // FNM_NOESCAPE match "\" separately
    var tokenizeRegex = options.FNM_NOESCAPE ?
        /\[[^\]]*\]|{[^}]*}|[^\[{]*/g :
        /\\(.)|\[[^\]]*\]|{[^}]*}|[^\\\[{]*/g;
    
    return new RegExp(
        '^' + 
        pattern.replace(tokenizeRegex, function (pattern, $1) {
            // if escaping is on, always return the next character escaped
            if (!options.FNM_NOESCAPE && (/^\\/).test(pattern) && $1) {
                return RegExp.escape($1);
            }
            if (/^\[/.test(pattern)) {
                var result = "[";
                pattern = pattern.slice(1, pattern.length - 1);
                // negation
                if (/^[!^]/.test(pattern)) {
                    pattern = pattern.slice(1);
                    result += "^";
                }
                // swap any range characters that are out of order
                pattern = pattern.replace(/(.)-(.)/, function(match, a, b) {
                    return a.charCodeAt(0) > b.charCodeAt(0) ? b + "-" + a : match;
                });
                return result + pattern.split("-").map(RegExp.escape).join("-") + ']';
            }
            if (/^\{/.test(pattern))
                return (
                    '(' +
                    pattern.slice(1, pattern.length - 1)
                    .split(',').map(function (pattern) {
                        return RegExp.escape(pattern);
                    }).join('|') +
                    ')'
                );
            return pattern
            .replace(exports.SEPARATORS_RE(), exports.SEPARATOR)    
            .split(new RegExp(
                exports.SEPARATOR + "?" +
                "\\*\\*" + 
                exports.SEPARATOR + "?"
            )).map(function (pattern) {
                return pattern.split(exports.SEPARATOR).map(function (pattern) {
                    if (pattern == "")
                        return "\\.?";
                    if (pattern == ".")
                        return;
                    if (pattern == "...")
                        return "(|\\.|\\.\\.(" + exports.SEPARATOR + "\\.\\.)*?)";
                    return pattern.split('*').map(function (pattern) {
                        return pattern.split('?').map(function (pattern) {
                            return RegExp.escape(pattern);
                        }).join(matchAny);
                    }).join(matchAny + '*');
                }).join(RegExp.escape(exports.SEPARATOR));
            }).join('.*?');
        }) +
        '$',
        options.FNM_CASEFOLD ? "i" : ""
    );
};

exports.copyTree = function(source, target, path) {
    var sourcePath = (source = exports.path(source)).join(path);
    var targetPath = (target = exports.path(target)).join(path);
    if (exports.exists(targetPath))
        throw new Error("file exists: " + targetPath);
    if (exports.isDirectory(sourcePath)) {
        exports.mkdir(targetPath);
        exports.list(sourcePath).forEach(function (name) {
            exports.copyTree(source, target, exports.join(path, name));
        });
    } else {
        exports.copy(sourcePath, targetPath);
    }
};

exports.match = function (path, pattern) {
    return exports.patternToRegExp(pattern).test(path);
};

exports.glob = function (pattern, flags) {
    pattern = String(pattern || '');
    var parts = exports.split(pattern),
        paths = ['.'];
    
    if (exports.isAbsolute(pattern))
    {
        paths = ["/"];
        parts.shift();
    }

    if (parts[parts.length-1] == "**")
        parts[parts.length-1] = "*";
    
    parts.forEach(function (part) {
        if (part == "") {
        } else if (part == "**") {
            paths = globTree(paths);
        } else if (part == "...") {
            paths = globHeredity(paths);
        } else if (/[\\\*\?\[{]/.test(part)) {
            paths = globPattern(paths, part, flags);
        } else {
            paths = paths.map(function (path) {
                if (path)
                    return exports.join(path, part);
                return part;
            }).filter(function (path) {
                return exports.exists(path);
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
    
    if (paths[0] === "") paths.shift();
    
    return paths;
};

var globTree = function (paths) {
    return Array.prototype.concat.apply(
        [],
        paths.map(function (path) {
            if (!exports.isDirectory(path))
                return [];
            return exports.listDirectoryTree(path).map(function (child) {
                return exports.join(path, child);
            });
        })
    );
};

var globHeredity = function (paths) {
    return Array.prototype.concat.apply(
        [],
        paths.map(function (path) {
            var isRelative = exports.isRelative(path);
            var heredity = [];
            var parts = exports.split(exports.absolute(path));
            if (parts[parts.length - 1] == "")
                parts.pop();
            while (parts.length) {
                heredity.push(exports.join.apply(null, parts));
                parts.pop();
            }
            if (isRelative) {
                heredity = heredity.map(function (path) {
                    return exports.relative("", path);
                });
            }
            return heredity;
        })
    );
};

var globPattern = function (paths, pattern, flags) {
    var re = exports.patternToRegExp(pattern, flags);
    // print("PATTERN={"+pattern+"} REGEXP={"+re+"}");
    // use concat to flatten result arrays
    return Array.prototype.concat.apply([], paths.map(function (path) {
        if (!exports.isDirectory(path))
            return [];
        return [/*".", ".."*/].concat(exports.list(path)).filter(function (name) {
            return re.test(name);
        }).map(function (name) {
            if (path)
                return exports.join(path, name);
            return name;
        }).filter(function (path) {
            return exports.exists(path);
        });
    }));
};

exports.globPaths = function (pattern, flags) {
    return exports.glob(pattern, flags).map(function (path) {
        return new exports.Path(path);
    });
};

exports.rmtree = function(path) {
    if (exports.isLink(path)) {
        exports.remove(path);
    } else
    if (exports.isDirectory(path)) {
        exports.list(path).forEach(function (name) {
            exports.rmtree(exports.join(path, name));
        });
        exports.rmdir(path);
    } else {
        exports.remove(path);
    }
};

if (!exports.mkdirs) {
    exports.mkdirs = function (path) {
        var parts = exports.split(path);
        var at = [];
        parts.forEach(function (part) {
            at.push(part);
            var path = exports.join.apply(null, at);
            try {
                exports.mkdir(path);
            } catch (exception) {
            }
        });
    };
}

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
    return target.join(exports.SEPARATOR);
};

exports.absolute = function (path) {
    return exports.resolve(exports.join(exports.cwd(), ''), path);
};

exports.cwdPath = function () {
    return new exports.Path(exports.cwd());
};

/* path wrapper, for chaining */

exports.path = function (/*path*/) {
    if (arguments.length == 1 && arguments[0] == "")
        return exports.Path("");
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

Path.prototype.glob = function (pattern, flags) {
    if (!this.isDirectory())
        return [];
    if (this.toString())
        return exports.glob(exports.join(this, pattern), flags);
    return exports.glob(pattern);
};

Path.prototype.globPaths = function (pattern, flags) {
    if (!this.isDirectory())
        return [];
    if (this.toString()) 
        return exports.glob(exports.join(this, pattern), flags).map(function (path) {
            return new exports.Path(path);
        }, this).filter(function(path) { return !!path.toString() });
    return exports.glob(pattern, flags);
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

var pathIterated = [
    'list',
    'listTree'
];

for (var i = 0; i < pathIterated.length; i++) {
    var name = pathIterated[i];

    // create the module-scope variant
    exports[name + 'Paths'] = (function (name) {
        return function () {
            return exports[name].apply(exports, arguments).map(function (path) {
                return new exports.Path(path);
            });
        };
    })(name);

    // create the Path object variant
    Path.prototype[name + 'Paths'] = (function (name) {
        return function () {
            var self = this;
            return exports[name](this).map(function (path) {
                return self.join(path);
            });
        };
    })(name);
}

var nonPathed = [
    'chmod',
    'chown',
    'copy',
    'exists',
    'extension',
    'isDirectory',
    'isFile',
    'isLink',
    'isReadable',
    'isWritable',
    'link',
    'linkExists',
    'list',
    'listTree',
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

for (var i = 0; i < nonPathed.length; i++) {
    var name = nonPathed[i];
    Path.prototype[name] = (function (name) {
        return function () {
            if (!exports[name])
                throw new Error("NYI Path based on " + name);
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

require("file-engine");
