var FILE = require("file");
var ASSERT = require("test/assert");
var UTIL = require("util");

var UNZIP = require("unzip");
var INFLATE = require("inflate");

exports.testZip = function() {
    var data = FILE.read("package.json.zip", "b");
    print(data);
    
    var zip = new UNZIP.Zip(data);
    
    while (true) {
        var header = zip.readLocalFileHeader();
        print("header="+UTIL.repr(header));
        ASSERT.eq(0x04034b50, header.signature);
        
        var compressed = zip.read(header.compressed_size);
        ASSERT.eq(header.compressed_size, compressed.length);
        
        if (header.flags & (1 << 3)) {
            var descriptor = zip.readDataDescriptor();
            print("descriptor="+UTIL.repr(descriptor));
            ASSERT.eq(header.crc_32, descriptor.crc_32);
            ASSERT.eq(header.compressed_size, descriptor.compressed_size);
            ASSERT.eq(header.uncompressed_size, descriptor.uncompressed_size);
        }

        var uncompressed = INFLATE.zip_inflate(String.fromCharCode.apply(String, compressed.toArray()));
        print(uncompressed);
    }
}

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));