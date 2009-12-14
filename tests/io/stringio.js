
var assert = require("test/assert");
var io = require("io");

exports.testStringIODelimiter = function () {
    var stringio = new io.StringIO("a\0b\0", "\0");
    assert.eq(["a\0", "b\0"], stringio.readLines());
};

exports.testStringIODelimiterForEach = function () {
    var stringio = new io.StringIO("a\0b\0", "\0");
    var acc = [];
    stringio.forEach(function (line) {
        acc.push(line);
    });
    assert.eq(["a", "b"], acc);
};


if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
