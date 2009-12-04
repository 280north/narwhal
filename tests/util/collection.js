
var assert = require("test/assert");
var util = require("util");

/*
exports.testKeys = function () {
};

exports.testValues = function () {
};

exports.testItems = function () {
};

exports.testLen = function () {
};

exports.testHas = function () {
};

*/

exports.testGetObject = function () {
    assert.eq(10, util.get({'a': 10}, 'a'));
};

exports.testGetObjectKeyError = function () {
    assert.throwsError(function () {
        util.get({'a': 10}, 'b');
    });
};

exports.testGetObjectDefault = function () {
    assert.eq(20, util.get({'a': 10}, 'b', 20));
};

exports.testGetNonPolymorphic = function () {
    var foo = {"get": 10};
    assert.eq(10, util.get(foo, "get"));
};

exports.testGetPolymorphic = function () {
    var foo = Object.create({"get": function () {
        return 10;
    }});
    assert.eq(10, util.get(foo, "get"));
};

exports.testGetArray = function () {
    assert.eq(1, util.get([1,2,3], 0));
};

exports.testGetArrayKeyError = function () {
    assert.throwsError(function () {
        util.get([1,2,3], 4);
    });
};

exports.testGetArrayDefault = function () {
    assert.eq(3, util.get([1,2,3], 4, 3));
};

/*
exports.testGetArrayNeg = function () {
    assert.eq(3, util.get([1,2,3], -1));
};
*/

exports.testGetString = function () {
    assert.eq('a', util.get('abc', 0));
    assert.eq('b', util.get('abc', 1));
};

/*

exports.testGetStringNeg = function () {
    assert.eq('c', util.get('abc', -1));
};

exports.testSet = function () {
};

exports.testGetset = function () {
};

exports.testDel = function () {
};

exports.testCut = function () {
};

exports.testPut = function () {
};

exports.testUpdate = function () {
};

exports.testComplete = function () {
};
*/

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

