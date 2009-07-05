
var util = require('util');
var assert = require('test/assert');
var fs = require('file');

util.forEachApply([
    ['', ''],
    ['.', ''],
    ['./', ''],
    ['../', '../'],
    ['../a', '../a'],
    ['../a/', '../a/'],
    ['a/..', ''],
    ['a/../', ''],
    ['a/../b', 'b'],
    ['a/../b/', 'b/'],
], function (path, expected) {
    exports['test ' + util.repr(path)] = function () {
        var result = '';
        var actual = fs.normal(path);
        assert.eq(expected, actual, util.repr(path));
    };
});

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

