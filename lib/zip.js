
// Tom Robinson

var FILE = require("file");
var UNZIP = require("./unzip");
var ByteIO = require("io").ByteIO;

exports.unzip = function (source, target) {
    if (!target)
        target = system.fs.path(source).absolute().dirname();
    target = system.fs.path(target);
    var unzip = new exports.Unzip(source);
    try{
        return unzip.forEach(function (entry) {
            var targetPath = target.join(entry.getName());
            if (entry.isDirectory())
                return;
            targetPath.dirname().mkdirs();
            targetPath.write(entry.read('b'), 'b');
        });
    }
    finally{
        unzip.close();
    }
};

var Unzip = exports.Unzip = function (path) {
    var data = FILE.read(path, "b");
    this._stream = new UNZIP.ZipStream(data);
};

Unzip.prototype.iterator = function () {
    var zip = this._stream;
    
    // find the end record and read it
    zip.locateEndOfCentralDirectoryRecord()
    var endRecord = zip.readEndOfCentralDirectoryRecord();
    
    // seek to the beginning of the central directory
    zip.seek(endRecord.central_dir_offset);
    
    var count = endRecord.central_dir_disk_records;
    
    return {
        next: function () {
            if ((count--) === 0)
                throw new StopIteration();

            // read the central directory header
            var centralHeader = zip.readCentralDirectoryFileHeader();

            // save our new position so we can restore it
            var saved = zip.position();

            // seek to the local header and read it
            zip.seek(centralHeader.local_file_header_offset);
            var localHeader = zip.readLocalFileHeader();

            var uncompressed = null;
            if (localHeader.file_name.slice(-1) !== "/") {
                uncompressed = zip.readUncompressed(centralHeader.compressed_size, centralHeader.compression_method);
            }

            // seek back to the next central directory header
            zip.seek(saved);

            return new Entry(localHeader, uncompressed ? new ByteIO(uncompressed) : uncompressed);
        }
    };
};

Unzip.prototype.forEach = function (block, context) {
    var iterator = this.iterator();
    var next;
    while (true) {
        try {
            next = iterator.next();
        } catch (exception) {
            // if (exception instanceof StopIteration)
                break;
            // else
            //     throw exception;
        }
        block.call(context, next);
    }
};

Unzip.prototype.close = function (mode, options) {
    // this._javaZipFile.close();
};

var Entry = exports.Entry = function (header, stream) {
    this._header = header;
    this._stream = stream;
};

exports.Entry.prototype.getName = function () {
    return this._header.file_name;
};

exports.Entry.prototype.isDirectory = function () {
    return this.getName().slice(-1) === "/";
};

exports.Entry.prototype.open = function (mode, options) {
    return this._stream;
};

exports.Entry.prototype.read = function () {
    return this.open().read();
};

exports.Entry.prototype.copy = function (output, mode, options) {
    return this.open().copy(output);
};


if (require.main === module) {
    var SYSTEM = require("system");
    if (SYSTEM.args.length < 2)
        throw "usage: "+SYSTEM.args[0]+" INPUT [OUTPUT]"
    exports.unzip(SYSTEM.args[1], SYSTEM.args[2]);
}