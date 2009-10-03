
var util = require('util');
var assert = require('test/assert');
var fs = require('file');

util.forEachApply([
    ['', ''],
    ['.', ''],
    ['..', ''],
    ['.a', ''],
    ['..a', ''],
    ['.a.b', '.b'],
    ['a.b', '.b'],
    ['a.b.c', '.c'],
    ['/', ''],
    ['/.', ''],
    ['/..', ''],
    ['/..a', ''],
    ['/.a.b', '.b'],
    ['/a.b', '.b'],
    ['/a.b.c', '.c'],
    ['foo/', ''],
    ['foo/.', ''],
    ['foo/..', ''],
    ['foo/..a', ''],
    ['foo/.a.b', '.b'],
    ['foo/a.b', '.b'],
    ['foo/a.b.c', '.c'],
    ['/foo/', ''],
    ['/foo/.', ''],
    ['/foo/..', ''],
    ['/foo/..a', ''],
    ['/foo/.a.b', '.b'],
    ['/foo/a.b', '.b'],
    ['/foo/a.b.c', '.c']
], function (path, expected) {
    exports['test ' + util.repr(path)] = function () {
        var actual = fs.extension(path);
        assert.eq(expected, actual, util.repr(path));
    };
});

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

