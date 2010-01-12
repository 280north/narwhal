
var assert = require("test/assert");
var util = require("util");

exports.testArray = function () {
    assert.isTrue(util.isArrayLike([]));
    assert.isTrue(util.isArrayLike([1, 2, 3]));
};

exports.testArguments = function () {
    assert.isTrue(util.isArrayLike(arguments));
};

exports.testArgumentsReturned = function () {
    assert.isTrue(util.isArrayLike((function () {
        return arguments;
    })()));
};

exports.testNegativeDuckType = function () {
    assert.isFalse(util.isArrayLike({
        "length": 1,
        "0": 1
    }));
};

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

