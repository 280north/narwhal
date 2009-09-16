
var io = require('io');

var javaZip = Packages.java.util.zip;
var JavaZipFile = javaZip.ZipFile;
var JavaZipEntry = javaZip.ZipEntry;

exports.unzip = function (source, target) {
    if (!target)
        target = system.fs.path(source).absolute().dirname();
    target = system.fs.path(target);
    return new exports.Unzip(source).forEach(function (entry) {
        var targetPath = target.join(entry.getName());
        if (entry.isDirectory())
            return;
        targetPath.dirname().mkdirs();
        targetPath.write(entry.read('b'), 'b');
    });
};

exports.Unzip = function (path) {
    this._javaZipFile = JavaZipFile(path);
};

exports.Unzip.prototype.iterator = function () {
    var self = this;
    var enumeration = this._javaZipFile.entries();
    return {
        next: function () {
            if (!enumeration.hasMoreElements())
                throw new StopIteration();
            return new exports.Entry(
                self._javaZipFile,
                enumeration.nextElement()
            );
        }
    };
};

exports.Unzip.prototype.forEach = function (block, context) {
    var iterator = this.iterator();
    var next;
    while (true) {
        try {
            next = iterator.next();
        } catch (exception) {
            break;
        }
        block.call(context, next);
    }
};

exports.Entry = function (javaZipFile, javaZipEntry) {
    this._javaZipFile = javaZipFile;
    this._javaZipEntry = javaZipEntry;
};

exports.Entry.prototype.getName = function () {
    return String(this._javaZipEntry.getName());
};

exports.Entry.prototype.isDirectory = function () {
    return Boolean(this._javaZipEntry.isDirectory());
};

exports.Entry.prototype.open = function (mode, options) {
    // TODO mode and options negotiation
    return new io.IO(this._javaZipFile.getInputStream(this._javaZipEntry));
};

exports.Entry.prototype.read = function () {
    return this.open().read();
};

exports.Entry.prototype.copy = function (output, mode, options) {
    return this.open().copy(output);
};

