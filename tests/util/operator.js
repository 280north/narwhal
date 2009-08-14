
var assert = require('test/assert');
var util = require("util");

exports.testNegative = function () {
    var foo = {"repr": 10};
    assert.eq('{"repr": 10}', util.repr(foo));
};

exports.testPositive = function () {
    var Foo = function () {
    };
    Foo.prototype.repr = function () {
        return "Foo()";
    };
    assert.eq("Foo()", util.repr(new Foo()));
};

exports.testCurry = function () {
    var lt10 = util.lt(10);
    assert.isTrue(lt10(5));
};

if (module.id == require.main)
    require("os").exit(require("test/runner").run(exports));
