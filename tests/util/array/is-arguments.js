
var assert = require("test/assert");
var util = require("narwhal/util");

exports.testArray = function () {
    assert.isFalse(util.isArguments([]));
    assert.isFalse(util.isArguments([1, 2, 3]));
};

exports.testArguments = function () {
    assert.isTrue(util.isArguments(arguments));
};

exports.testArgumentsReturned = function () {
    assert.isTrue(util.isArguments((function () {
        return arguments;
    })()));
};

exports.testNegativeDuckType = function () {
    assert.isFalse(util.isArguments({
        "length": 1,
        "0": 1
    }));
};

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

