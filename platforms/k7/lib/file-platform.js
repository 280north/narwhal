
var file = require('./file');

exports.SEPARATOR = '/';

exports.cwd = function () {
    throw Error("Not yet implemented.");
};

// TODO necessary for package loading
exports.list = function (path) {
    throw Error("Not yet implemented.");
};

// TODO necessary for package loading
exports.canonical = function (path) {
    throw Error("Not yet implemented.");
};

exports.exists = function (path) {
    throw Error("Not yet implemented.");
};

// TODO necessary for lazy module reloading in sandboxes
exports.mtime = function (path) {
    throw Error("Not yet implemented.");
};

exports.size = function (path) {
    throw Error("Not yet implemented.");
};

exports.stat = function (path) {
    return {
        mtime: exports.mtime(path),
        size: exports.size(path)
    }
};

exports.isDirectory = function (path) {
    throw Error("Not yet implemented.");
};

// TODO necessary for module loading
exports.isFile = function (path) {
    throw Error("Not yet implemented.");
};

exports.isFile = system.fs.isFile; // TEMPORARY HACK

exports.isLink = function (path) {
    throw Error("Not yet implemented.");
};

exports.isReadable = function (path) {
    throw Error("Not yet implemented.");
};

exports.isWritable = function (path) {
    throw Error("Not yet implemented.");
};

exports.rename = function (source, target) {
    throw Error("Not yet implemented.");
};

exports.move = function (source, target) {
    throw Error("Not yet implemented.");
};

exports.remove = function (path) {
    throw Error("Not yet implemented.");
};

exports.mkdir = function (path) {
    throw Error("Not yet implemented.");
};

exports.rmdir = function(path) {
    throw Error("Not yet implemented.");
};

exports.touch = function (path, mtime) {
    throw Error("Not yet implemented.");
};

// FIXME temporary hack
var read = system.fs.read; // from k7 bootstrap fixtures

exports.FileIO = function (path, mode, permissions) {
    mode = file.mode(mode);
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

