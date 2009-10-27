
var assert = require("test/assert");
var file = require("file");
var util = require("util");

util.forEachApply([
    ["/", "/"],
    ["/a", "/a"],
    ["/a/b", "/a"],
    ["/a/b/", "/a"]
        
], function (path, expected) {
    exports['test ' + util.repr(arguments)] = function () {
        assert.eq(expected, file.dirname(path));
    };
});

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

