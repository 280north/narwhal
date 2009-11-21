
var assert = require("test/assert");
var util = require("util");

exports.testRange1 = function () {
    assert.eq([0, 1, 2], util.range(3));
};

exports.testRange2 = function () {
    assert.eq([1, 2, 3], util.range(1, 4));
};

exports.testRange3 = function () {
    assert.eq([2, 4, 6], util.range(2, 8, 2));
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

