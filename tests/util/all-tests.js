
var assert = require("test/assert");
var util = require("narwhal/util");

exports.testOperator = require("./operator");
exports.testObject = require("./object");
exports.testArray = require("./array");
exports.testCollection = require("./collection");
exports.testString = require("./string");
exports.testRange = require("./range");
exports.testCase = require("./case");
exports.testUnique = require("./unique");

exports.testNo = function () {
    assert.isTrue(util.no(undefined));
    assert.isTrue(util.no(null));
    assert.isFalse(util.no(0));
    assert.isFalse(util.no(false));
};

exports.testApply = function () {
    // XXX
};

exports.testCopyUndefined = function () {
    assert.eq(undefined, util.copy(undefined));
};

exports.testCopyNull = function () {
    assert.eq(null, util.copy(null));
};

exports.testCopyNumber = function () {
    assert.eq(1, util.copy(1));
};

exports.testCopyDate = function () {
    var date = new Date();
    assert.eq(date, util.copy(date));
};

/*
exports.testDeepCopy = function () {
};
*/

exports.testRepr = require("./repr");

/*
exports.testIs = function () {
};

*/

exports.testEq = require("./eq");

/*
exports.testNe = function () {
};

exports.testLt = function () {
};

exports.testGt = function () {
};

exports.testLe = function () {
};

exports.testGe = function () {
};

exports.testCompare = function () {
};
*/

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

