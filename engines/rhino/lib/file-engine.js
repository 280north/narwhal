
// use the "file" module as the exports object.
var exports = require('./file');

// File: Rhino

var IO = require("./io").IO;
var os = require('./os');

var javaRuntime = function () {
    return Packages.java.lang.Runtime.getRuntime();
};

var javaPopen = function (command) {
    return javaRuntime().exec(command);
};

/* streams */

exports.FileIO = function (path, mode, permissions) {
    path = JavaPath(path);

    var {
        read: read,
        write: write,
        append: append,
        update: update
    } = exports.mode(mode);

    if (update) {
        throw new Error("Updating IO not yet implemented.");
    } else if (write || append) {
        return new IO(null, new Packages.java.io.FileOutputStream(path, append));
    } else if (read) {
        return new IO(new Packages.java.io.FileInputStream(path), null);
    } else {
        throw new Error("Files must be opened either for read, write, or update mode.");
    }
};

/* paths */

exports.cwd = function () {
    return String(Packages.java.lang.System.getProperty("user.dir"));
};

var JavaPath = function (path) {
    return new java.io.File(String(path));
};

exports.canonical = function (path) {
    return String(JavaPath(path).getCanonicalPath());
};

exports.mtime = function (path) {
    path = JavaPath(path);
    var lastModified = path.lastModified();
    if (lastModified === 0) return undefined;
    else return new Date(lastModified);
};

exports.size = function (path) {
    path = JavaPath(path);
    return path.length();
};

exports.stat = function (path) {
    path = JavaPath(path);
    return {
        mtime: exports.mtime(path),
        size: exports.size(path)
    }
};

exports.exists = function (path) {
    return JavaPath(path).exists();
};

exports.linkExists = function (path) {
    return exports.isLink(path) || exports.exists(path);
};

exports.isDirectory = function (path) {
    try { return JavaPath(path).isDirectory(); } catch (e) {}
    return false;
};

exports.isFile = function (path) {
    try { return JavaPath(path).isFile(); } catch (e) {}
    return false;
};

// XXX not standard
exports.isAbsolute = function (path) {
    return new java.io.File(path).isAbsolute();
};

/* java doesn't provide isLink, but File.getCanonical leaks
   information about whether a file is a link, so we use the canonical
   file name of a path and the canonical file name of the
   containing directory to infer whether the file is a link.
*/
exports.isLink = function (path) {
    path = exports.path(path);
    var canonical = path.canonical().toString();
    var container = path.resolve('.').canonical();
    if (path.isDirectory()) {
        return container.toString() != canonical;
    } else {
        return container.join('').resolve(path.basename()).toString() != canonical;
    }
};

exports.isReadable = function (path) {
    return JavaPath(path).canRead();
};

exports.isWritable = function (path) {
    return JavaPath(path).canWrite();
};

exports.chmod = function (path, mode) {
    os.command(['chmod', mode.toString(8), path]);
};

exports.chown = function (path, owner, group) {

    if (!owner)
        owner = "";
    else
        owner = String(owner);

    if (group)
        group = String(group);

    if (/:/.test(owner))
        throw new Error("Invalid owner name");
    if (/:/.test(group))
        throw new Error("Invalid group name");

    if (group)
        owner = owner + ":" + String(group);

    os.command(['chown', owner, path]);
};

exports.link = function (source, target) {
    os.command(['ln', source, target]);
};

exports.symlink = function (source, target) {
    // XXX this behavior of resolving the source
    // path from the target path when the source 
    // path is relative ought to be discussed
    // on ServerJS
    if (exports.isRelative(source))
        source = exports.relative(target, source);
    os.command(['ln', '-s', source, target]);
};

exports.rename = function (source, target) {
    source = exports.path(source);
    target = source.resolve(target);
    source = JavaPath(source);
    target = JavaPath(target);
    if (!source.renameTo(target))
        throw new Error("failed to rename " + source + " to " + target);
};

exports.move = function (source, target) {
    source = exports.path(source);
    target = exports.path(target);
    source = JavaPath(source);
    target = JavaPath(target);
    if (!source.renameTo(target))
        throw new Error("failed to rename " + source + " to " + target);
};

exports.remove = function (path) {
    if (!JavaPath(path)['delete']())
        throw new Error("failed to delete " + path);
};

exports.mkdir = function (path) {
    if (!JavaPath(path).mkdir())
        throw new Error("failed to make directory " + path);
};

exports.mkdirs = function(path) {
    JavaPath(path).mkdirs();
    if (!exports.isDirectory(path))
        throw new Error("failed to make directories leading to " + path);
};

exports.rmdir = function(path) {
    if (!JavaPath(String(path))['delete']())
        throw new Error("failed to remove the directory " + path);
};

exports.list = function (path) {
    path = JavaPath(String(path));
    var listing = path.list();

    if (!(listing instanceof Array)) {
        throw new Error("no such directory: " + path);
    }

    var paths = [];
    for (var i = 0; i < listing.length; i++) {
        paths[i] = String(listing[i]);
    }

    return paths;
};

exports.touch = function (path, mtime) {
    if (mtime === undefined || mtime === null)
        mtime = new Date();
    path = JavaPath(path);
    path.createNewFile();
    if (!path.setLastModified(mtime.getTime()))
        throw new Error("unable to set mtime of " + path + " to " + mtime);
};

