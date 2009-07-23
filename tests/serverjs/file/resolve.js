
var system = require('system');
var util = require('util');
var assert = require('test/assert');
var fs = require('file');

util.forEachApply([
    [['/'], '/'],
    [['/a'], '/a'],
    [['/a/'], '/a/'], 
    [['/a', '/b'], '/b'], 
    [['/a', '/b/'], '/b/'], 
    [['/', 'a'], '/a'],
    [['/', 'a/'], '/a/'],
    [['/a', 'a'], '/a'],
    [['/a', 'a/'], '/a/'],
    [['/a/', 'a'], '/a/a'],
    [['/a/', 'a/'], '/a/a/'],
    [['..'], '../'],
    [['..', 'a'], '../a'],
    [['..', 'a/'], '../a/'],
    [['.'], ''],
    [['.', 'a'], 'a'],
    [['.', 'a/'], 'a/'],
    [['a', '.'], ''],
    [['a', '.', 'a'], 'a'],
    [['a', '.', 'a/'], 'a/'],
    [['a', '..'], '../'],
    [['a', '..', 'a'], '../a'],
    [['a', '..', 'a/'], '../a/'],
    [['a/', '..'], ''],
    [['a/', '..', 'a'], 'a'],
    [['a/', '..', 'a/'], 'a/'],
    [['a/b', ''], 'a/b'],
], function (parts, expected) {
    exports['test ' + util.repr(parts)] = function () {
        var result = '';
        var actual = fs.resolve.apply(null, parts);
        assert.eq(expected, actual, util.repr(parts));
    };
});

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
