
var util = require('util');
var assert = require('test/assert');
var fs = require('file');

util.forEachApply([
    ['', '.'],
    ['.', '.'],
    ['foo', '.'],
    //['foo/', '.'],
    ['foo/bar', 'foo'],
    ["/", "/"],
    ["/a", "/a"],
    ["/a/b", "/a"],
    ["/a/b/", "/a"]

    // TODO: many more tests
], function (path, expected) {
    exports['test ' + util.repr(path)] = function () {
        var actual = fs.dirname(path);
        assert.eq(expected, actual, util.repr(path));
    };
});

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

