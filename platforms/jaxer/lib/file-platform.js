var IO = require('./io').IO,
    file = require('./file'),
    NSFile = new Components.Constructor("@mozilla.org/file/local;1",
        "nsILocalFile", "initWithPath");

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

exports.mtime = Jaxer.File.dateModified;

exports.size = function (path) {
    throw Error("size not yet implemented.");
};

exports.stat = function (path) {
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
};
// XXX remove this if you implement isFile here
// from bootstrap system object:
exports.isFile = system.fs.isFile;

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
var read = system.fs.read; // from bootstrap system object

exports.FileIO = function (path, mode, permissions) {
    path = new NSFile(path);
    var {
        read: read,
        write: write,
        append: append,
        update: update
    } = file.mode(mode);

    if (update) {
        throw new Error("Updating IO not yet implemented.");
    } else if (write || append) {

        var stream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                                createInstance(Components.interfaces.nsIFileOutputStream);
        stream.init(path, -1, -1, 0);
        return new IO(stream, null);
    } else if (read) {

        var stream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                                createInstance(Components.interfaces.nsIFileInputStream);
        stream.init(path, -1, 0, 0);
        return new IO(stream, null);
    } else {
        throw new Error("Files must be opened either for read, write, or update mode.");
    }
};
