var FILE = require("file");
var ASSERT = require("test/assert");

var INFLATE;
exports.testNoGlobals = function() {
    INFLATE = require("inflate");
}

exports.testUnzip = function() {
    var binary = FILE.read("package.json.Z", "b");
    print(binary);

    var bytes = binary.toArray();
    print(bytes);

    var str = String.fromCharCode.apply(String, bytes);

    var x = INFLATE.zip_inflate(str);
    print(x);
}

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));
