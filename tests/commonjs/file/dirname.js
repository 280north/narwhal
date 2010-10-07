
var util = require("narwhal/util");
var assert = require('test/assert');
var fs = require('file');

util.forEachApply([
    // relative
    ['', '.'],
    ['.', '.'],
    ['foo', '.'],
    ['foo/', '.'],
    ['foo/bar', 'foo'],
    ['foo/bar/', 'foo'],
    // absolute
    ["/", "/"],
    ["/foo", "/"],
    ["/foo/", "/"],
    ["/foo/bar", "/foo"],
    ["/foo/bar/", "/foo"]
    // TODO: many more tests
    // TODO: Windows tests
], function (path, expected) {
    exports['test ' + util.repr(path)] = function () {
        var actual = fs.dirname(path);
        assert.eq(expected, actual, util.repr(path));
    };
});

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

