
var system = require('system');
var util = require("narwhal/util");
var assert = require('test/assert');
var fs = require('file');

util.forEachApply([
    ['', '', ''],
    ['.', '', ''],
    ['', '.', ''],
    ['.', '.', ''],
    ['', '..', '../'],
    ['', '../', '../'],
    ['a', 'b', 'b'],
    ['../a', '../b', 'b'],
    ['../a/b', '../a/c', 'c'],
    ['a/b', '..', '../../'],
    ['a/b', 'c', '../c'],
    ['a/b', 'c/d', '../c/d'],
    // XXX the next two are disputed - kriskowal
    ["a", "a/b/c", "b/c"],
    ["a/", "a/b/c", "b/c"]
        
], function (source, target, expected) {
    var name = (
        util.repr(source) + ' -> ' + util.repr(target) +
        ' = ' + util.repr(expected)
    );
    exports['test ' + name] = function () {
        var result = '';
        var actual = fs.relative(source, target);
        assert.eq(
            expected,
            actual,
            name
        );
    };
});

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

