
var assert = require("test/assert");
var file = require("file");
var util = require("util");

util.forEachApply([
    ["a", "a/b/c", "b/c"],
    ["a/", "a/b/c", "b/c"]

], function (from, path, expected) {
    exports['test ' + util.repr(arguments)] = function () {
        assert.eq(expected, file.relative(from, path));
    };
});

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

