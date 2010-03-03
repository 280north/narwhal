
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- cadorn Christoph Dorn

var exports = require('./file');

exports.SEPARATOR = '/';

exports.cwd = function () {
    throw Error("cwd not yet implemented.");
    // might work if you don't implement canonical
    // in terms of cwd:
    return exports.canonical('.');
};

// TODO necessary for package loading
exports.list = function (path) {
    throw Error("list not yet implemented.");
};

// TODO necessary for package loading
exports.canonical = function (path) {
    throw Error("canonical not yet implemented.");
    // an implementation in terms of readlink, cwd, and the pure-js
    // methods provided by Narwhal's file-bootstrap, join, split,
    // and isDrive, which depends on system.os to distinguish
    // windows and unix drives
    var paths = [exports.cwd(), path];
    var outs = [];
    var prev;
    for (var i = 0, ii = paths.length; i < ii; i++) {
        var path = paths[i];
        var ins = exports.split(path);
        if (exports.isDrive(ins[0]))
            outs = [ins.shift()];
        while (ins.length) {
            var leaf = ins.shift();
            var consider = exports.join.apply(
                undefined,
                outs.concat([leaf])
            );

            // cycle breaker; does not throw an error since every
            // invalid path must also have an intrinsic canonical
            // name.
            if (consider == prev) {
                ins.unshift.apply(ins, exports.split(link));
                break;
            }
            prev = consider;

            try {
                var link = exports.readlink(consider);
            } catch (exception) {
                link = undefined;
            }
            if (link !== undefined) {
                ins.unshift.apply(ins, exports.split(link));
            } else {
                outs.push(leaf)
            }
        }
    }
    return exports.join.apply(undefined, outs);
};

exports.exists = function (path) {
    throw Error("exists not yet implemented.");
};

// TODO necessary for lazy module reloading in sandboxes
exports.mtime = function (path) {
    throw Error("mtime not yet implemented.");
};

exports.size = function (path) {
    throw Error("size not yet implemented.");
};

exports.stat = function (path) {
    throw Error("stat not yet implemented.");
    // this might work if you've got mtime and size implemented
    // separately.  this isn't a complete stat implementation.
    return {
        mtime: exports.mtime(path),
        size: exports.size(path)
    }
};

// TODO necessary for package loading
exports.isDirectory = function (path) {
    throw Error("isDirectory not yet implemented.");
};

// TODO necessary for module loading
exports.isFile = function (path) {
    throw Error("isFile not yet implemented.");
    // XXX note that isFile is one of the routines
    // probably at least partially implemented by
    // the partial "file" module injected by the
    // engine bootstrap.js.
};

exports.isLink = function (path) {
    throw Error("isLink not yet implemented.");
};

exports.isReadable = function (path) {
    throw Error("isReadable not yet implemented.");
};

exports.isWritable = function (path) {
    throw Error("isWritable not yet implemented.");
};

exports.rename = function (source, target) {
    throw Error("rename not yet implemented.");
};

exports.move = function (source, target) {
    throw Error("move not yet implemented.");
};

exports.remove = function (path) {
    throw Error("remove not yet implemented.");
};

exports.mkdir = function (path) {
    throw Error("mkdir not yet implemented.");
};

exports.rmdir = function(path) {
    throw Error("rmdir not yet implemented.");
};

exports.touch = function (path, mtime) {
    throw Error("touch not yet implemented.");
};

exports.read = function (path) {
    throw Error("read not yet implemented.");
    // XXX Note: read is one of the methods that was
    // at least partially implemented in the engine's
    // bootstrap.js.  you might take advanage of that
    // at least temporarily; until you can implement
    // read in terms of open(path).read()
};

exports.FileIO = function (path, mode, permissions) {
    mode = exports.mode(mode);
    var read = mode.read,
        write = mode.write,
        append = mode.append,
        update = mode.update;

    if (update) {
        throw new Error("Updating IO not yet implemented.");
    } else if (write || append) {
        throw new Error("Writing IO not yet implemented.");
    } else if (read) {
        // FIXME temporary hack
        return {
            'read': function () {
                return read(path);
            },
            'close': function () {
            }
        };
    } else {
        throw new Error("Files must be opened either for read, write, or update mode.");
    }
};

