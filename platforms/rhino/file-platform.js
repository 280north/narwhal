// File: Rhino

var IO = require("./io").IO;

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

var file = require('file');

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

exports.exists = function (path) {
    return JavaPath(path).exists();
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

var rmtree = exports.rmtree = function(path) {
    if (!(path instanceof java.io.File)) {
        path = JavaPath(path);
    }
    var files = path.listFiles();
    files.forEach(function(f) {
        if (f.isDirectory()) {
            rmtree(f);
        } else {
            f['delete']();
        }
    });
    path['delete']();
}

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

    var i = -1;

    paths.next = function () {
        i++;
        if (i >= paths.length)
            throw new Error("StopIteration");
        return paths[i];
    };

    paths.prev = function () {
        i--;
        if (i < 0)
            throw new Error("StopIteration");
        return paths[i];
    };

    paths.iter = function () {
        return paths;
    };

    paths.forEach = function (relation) {
        for (var i = 0; i < paths.length; i++) {
            relation(paths[i]);
        }
    };

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

/*
exports.open = function (path, mode, permissions, encoding, options) {
    throw new Error("not yet implemented.");

    path = JavaPath(path);
    if (mode === undefined || permissions == null)
        mode = "r";
    mode = String(mode);
    if (permissions == undefined || permissions == null)
        permissions = 0777;
    if (encoding === undefined || encoding === null)
        encoding = 'binary';
    options = options || {};

    var read, write, append, noTruncate;
    mode.split("").forEach(function (option) {
        if (option == 'r') {
            read = true;
        } else if (option == 'w') {
            write = true;
        } else if (option == 'a') {
            append = true;
        } else if (option == '+') {
            noTruncate = true;
        } else {
            throw new Error("unrecognized mode option in open: " + option);
        }
    });

    var buffering = options.buffering;
    var errors = options.errors;

    if (read + write + append > 1) {
        throw new Error("files can be opened for only one of read, write, or append modes.");
    }
    if (!(read || write || append)) {
        throw new Error("file must be opened for read, write, or append mode.");
    }
    if (encoding == 'binary' && errors) {
        throw new Error("binary encodingdoes not support error lists.");
    }

    var raw = FileIO(path, mode, permissions);
    var lineBuffering = buffering == 1 || buffering === undefined && raw.isatty();

    if (lineBuffering || buffering === undefined) {
        buffering = 8 * 1024; // international standard buffer size
        // try to set it to stat(path).blockSize
    }
    if (buffering < 0) {
        throw new Error("invalid buffering size");
    }
    if (buffering === 0) {
        if (encoding == "binary") {
            return raw;
        }
        throw new Error("can't have unbuffered text IO");
    }
    if (encoding == "binary") {
        throw new Error("encoding must not be binary to buffer.");
    }

    var buffer;
    if (update) {
        buffer = BufferedRandom(raw, buffering);
    } else if (write || append) {
        buffer = BufferedWriter(raw, buffering);
    } else if (reading) {
        buffer = BufferedReader(raw, buffering);
    } else {
        throw new Error("file must be opened for read, write, or append mode.");
    }

    return TextIOWrapper(buffer, encoding, errors, newLine, lineBuffering);

};
*/

exports.open = function (path, mode, permissions, encoding, options) {

    if (typeof path != 'string' && arguments.length == 1) {
        options = path;
        var {path: path} = options;
    } else if (typeof path != 'string' && arguments.length == 2) {
        options = mode;
        var {path: path} = mode;
    }

    if (!mode) {
        mode = 'r';
    }

    var reading, writing, appending, updating, truncating = true, canonical, exclusive;
    mode.split("").forEach(function (option) {
        if (option == 'r') {
            reading = true;
        } else if (option == 'w') {
            writing = true;
        } else if (option == 'a') {
            appending = true;
        } else if (option == '+') {
            truncating = false;
        } else if (option == 'c') {
            canonical = true;
        } else if (option == 'x') {
            exclusive = true;
        } else {
            throw new Error("unrecognized mode option in open: " + option);
        }
    });

    if (updating) {
        throw new Error("NYI");
    } else if (writing || appending) {
        return {
            'write': function (data) {
                return File.write(path, data);
            },
            'flush': function () {
            },
            'close': function () {
            }
        }
    } else if (reading) {
        return {
            'read': function () {
                return File.read(path);
            },
            'close': function () {
            }
        }
    } else {
        throw new Error("NYI");
    }

};

