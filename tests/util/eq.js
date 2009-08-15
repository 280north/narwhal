
var assert = require("test/assert");
var util = require("util");

exports.testUndefined = function () {
    assert.isTrue(util.eq(undefined, undefined));
};

exports.testNull = function () {
    assert.isTrue(util.eq(null, null));
};

exports.testNumber = function () {
    assert.isTrue(util.eq(1, 1));
};

exports.testNaN = function () {
    assert.isFalse(util.eq(NaN, NaN));
};

exports.testObject = function () {
    assert.isTrue(util.eq({"a": 10}, {"a": 10}));
};

exports.testObjectNegativePrototype = function () {
    function Type() {};
    Type.prototype.a = 10;
    var object = new Type();
    assert.isFalse(util.eq({"a": 10}, object));
};

exports.testArray = function () {
    assert.isTrue(util.eq([1,2,3], [1,2,3]));
};

exports.testArguments = function () {
    var args = (function () {return arguments})(1, 2, 3);
    assert.isTrue(util.eq([1, 2, 3], args));
};

exports.testPolymorphic = function () {
    function Type() {};
    Type.prototype.eq = function () {
        return true;
    };
    assert.isTrue(util.eq(new Type(), [1,2,3]));
};

exports.testCurry = function () {
    assert.isTrue(util.eq()());
    assert.isTrue(util.eq(10)(10));
    assert.isFalse(util.eq(10)(20));
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

