
var assert = require("test/assert");
var util = require("util");

exports.testObject = function () {
    assert.eq('{"a": 10}', util.repr({"a": 10}));
};

exports.testArray = function () {
    assert.eq('[1, 2, 3]', util.repr([1, 2, 3]));
};

exports.testArguments = function () {
    var args = (function () {return arguments})(1, 2, 3);
    assert.eq('[1, 2, 3]', util.repr(args));
};

/*
exports.testType = function () {
    assert.eq('', util.repr());
};
*/

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

