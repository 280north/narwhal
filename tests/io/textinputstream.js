var assert = require("test/assert");

exports.testTextInputStreamReadUnicodeOnBoundary = function() {
    var str = Array(1024).join(" ") + "ü";
    try {
        system.fs.write("testTextInputStreamReadUnicodeOnBoundary", str, { charset : "UTF-8" });
        var b = system.fs.read("testTextInputStreamReadUnicodeOnBoundary", "b");
        var strA = b.decodeToString("UTF-8");
        assert.eq(str, strA);
    } finally {
        system.fs.remove("testTextInputStreamReadUnicodeOnBoundary");
    }
}

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
