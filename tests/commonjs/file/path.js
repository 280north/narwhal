
var assert = require("test/assert");
var file = require("file");
var util = require("narwhal/util");

util.forEachApply([
    ["/", "a", "/a"],
    [".", "a", "./a"]
], function (path, rel, expected) {
    exports['test path.join ' + util.repr(arguments)] = function () {
        assert.eq(expected, system.fs.path(path).join(rel));
    };
});

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

