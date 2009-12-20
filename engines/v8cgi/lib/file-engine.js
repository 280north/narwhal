
var exports = require('./file');

exports.SEPARATOR = '/';

exports.cwd = function () {
    return system.getcwd();
};

// TODO necessary for package loading
exports.list = function (path) {
    var d = new Directory(path);
    return d.listFiles().concat(d.listDirectories()).sort();
};

// TODO necessary for package loading
exports.canonical = function (path) {
    return (exports.isAbsolute(path) ? '' : system.getcwd() + '/') + path;
};

exports.open = system.fs.open;

exports.read = system.fs.read;

exports.exists = function (path) {
    return new File(path).exists()
};

// TODO necessary for lazy module reloading in sandboxes
exports.mtime = function (path) {
    return exports.stat(path).mtime;
};

exports.size = function (path) {
    return exports.stat(path).size;
};

exports.stat = function (path) {
    return new File(path).stat()
};

// TODO necessary for package loading
exports.isDirectory = function (path) {
    return new Directory(path).isDirectory();
};

exports.isFile = system.fs.isFile;

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
                return function(path){ return new File(path).open('r').read() };
            },
            'close': function () {
            }
        };
    } else {
        throw new Error("Files must be opened either for read, write, or update mode.");
    }
};
