
var exports = require('./file');

exports.SEPARATOR = '/';

exports.cwd = function () {
    throw Error("cwd not yet implemented.");
};

// TODO necessary for package loading
exports.list = function (path) {
    throw Error("list not yet implemented.");
};

// TODO necessary for package loading
exports.canonical = function (path) {
    throw Error("canonical not yet implemented.");
};

exports.exists = function (path) {
    throw Error("exists not yet implemented.");
};

// TODO necessary for lazy module reloading in sandboxes
exports.mtime = function (path) {
    return exports.stat(path).mtime;
};

exports.size = function (path) {
    throw Error("size not yet implemented.");
};

exports.stat = function (path) {
    return _system.posix.stat(path);
};

// TODO necessary for package loading
exports.isDirectory = function (path) {
    throw Error("isDirectory not yet implemented.");
};

// TODO necessary for module loading
exports.isFile = function (path) {
    throw Error("isFile not yet implemented.");
};

exports.isFile = system.fs.isFile; // TEMPORARY HACK

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

// FIXME temporary hack
var read = system.fs.read; // from k7 bootstrap fixtures

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
            },
            'isatty': function () {
                return false;
            }
        };
    } else {
        throw new Error("Files must be opened either for read, write, or update mode.");
    }
};

// vim: ts=4 sw=4 et
