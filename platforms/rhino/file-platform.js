// File: Rhino

var IO = require("./io").IO;
var file = require('file');

/* deprecated File object */

var File = exports.File = function(path, mode) {
    this.file = new java.io.File(path);
    
    if (mode) {
        if (mode.indexOf("+") >= 0 || mode.indexOf("r") >= 0)
            this.inputStream = new Packages.java.io.FileInputStream(this.file);

        if (mode.indexOf("a") >= 0)
            this.outputStream = new Packages.java.io.FileOutputStream(this.file, true); 
        else if (mode.indexOf("+") >= 0 || mode.indexOf("w") >= 0)
            this.outputStream = new Packages.java.io.FileOutputStream(this.file, false);
    }
}

var File = exports.File = require("file-platform").File;
File.read = function(path) {
    var f = new File(path, "r");
    try {
        return f.read.apply(f, Array.prototype.slice.call(arguments, 1));
    } finally {
        f.close();
    }
}

File.write = function(path) {
    var f = new File(path, "w");
    try {
        return f.write.apply(f, Array.prototype.slice.call(arguments, 1));
    } finally {
        f.close();
    }
}


File.prototype = new IO();

File.prototype.size = function() {
    return Number(this.file.length());
}

File.prototype.isReadable = function() {
    return Boolean(this.file.canRead());
}

File.prototype.isWritable = function() {
    return Boolean(this.file.canWrite());
}

File.prototype.mtime = function() {
    var lastModified = this.file.lastModified();
    if (lastModified === 0)
        return undefined;
    else
        return new Date(lastModified);
}

File.prototype.exists = function () {
    return this.file.exists();
};

/* streams */

exports.FileIO = function (path, mode, permissions) {
    var {
        read: read,
        write: write,
        append: append,
        update: update
    } = file.mode(mode);

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

exports.SEPARATOR = '/';

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

exports.isDirectory = function (path) {
    return JavaPath(path).isDirectory();
};

exports.isFile = function (path) {
    return JavaPath(path).isFile();
};

/* java doesn't provide isLink, but File.getCanonical leaks
   information about whether a file is a link, so we use the canonical
   file name of a path and the canonical file name of the
   containing directory to infer whether the file is a link.
*/
exports.isLink = function (path) {
    path = file.path(path);
    var canonical = path.canonical().toString();
    var container = path.dirname().canonical();
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

exports.rename = function (source, target) {
    source = file.path(source);
    target = source.resolve(target);
    source = JavaPath(source);
    target = JavaPath(target);
    if (!source.renameTo(target))
        throw new Error("failed to rename " + source + " to " + target);
};

exports.move = function (source, target) {
    source = file.path(source);
    target = file.path(target);
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
}

exports.mkdirs = function(path) {
    if (!JavaPath(path).mkdirs())
        throw new Error("failed to make directories leading to " + path);
}

exports.rmdir = function(path) {
    if (!JavaPath(Path)['delete']())
        throw new Error("failed to remove the directory " + path);
}

exports.rmtree = function(path) {
    if (!(path instanceof java.io.File)) {
        path = JavaPath(path);
    }
    var files = path.listFiles();
    files.forEach(function(f) {
        if (f.isDirectory()) {
            exports.rmtree(f);
        } else {
            f['delete']();
        }
    });
}

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


