
var system = require('system');
var util = require('util');
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

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

