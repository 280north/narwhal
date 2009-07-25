
var assert = require("test/assert");
var util = require("util");

exports.testArray = function () {
    assert.eq([1,2,3], util.array([1,2,3]));
};

exports.testArrayShallow = function () {
    var foo = {"a": 10};
    var copy = util.array([foo]);
    assert.eq([{"a": 10}], copy);
    foo.a = 20;
    assert.eq([{"a": 20}], copy);
};

exports.testArrayObject = function () {
    assert.eq([["a", 10], ["b", 20]], util.array({"a": 10, "b": 20}));
};

exports.testIsArrayLikeArray = function () {
    assert.isTrue(util.isArrayLike([]));
    assert.isTrue(util.isArrayLike([1, 2, 3]));
};

exports.testIsArrayLikeArguments = function () {
    assert.isTrue(util.isArrayLike(arguments));
};

exports.testIsArrayLikeArgumentsReturned = function () {
    assert.isTrue(util.isArrayLike((function () {
        return arguments;
    })()));
};

exports.testCopyShallow = function () {
    var foo = {"a": 10};
    var copy = util.copy([foo]);
    assert.eq([{"a": 10}], copy);
    foo.a = 20;
    assert.eq([{"a": 20}], copy);
};

exports.testDeepCopy = function () {
    var foo = {"a": 10};
    var original = [foo];
    var copy = util.deepCopy(original);
    assert.eq([{"a": 10}], copy);
    foo.a = 20;
    assert.eq([{"a": 20}], original);
    assert.eq([{"a": 10}], copy);
};

exports.testLen = function () {
    assert.eq(0, util.len([]));
    assert.eq(1, util.len([0]));
    assert.eq(2, util.len([0, 1]));
};

exports.testLenLiar = function () {
    assert.eq(1, util.len({'length': 10}));
    assert.eq(10, util.array.len({'length': 10}));
};

exports.testHasPositive = function () {
    assert.isTrue(util.has([1,2,3], 2));
};

exports.testHasNegative = function () {
    assert.isFalse(util.has([1,2,3], 4));
};

exports.testPut = function () {
    var original = [1, 2, 3];
    util.put(original, 0, 0);
    assert.eq([0, 1, 2, 3], original);
};

exports.testDel = function () {
    var original = [1, 2, 3];
    util.del(original, 1);
    assert.eq([1, 3], original);
};

exports.testDelRange = function () {
    var original = [1, 2, 3, 4];
    util.del(original, 1, 3);
    assert.eq([1, 4], original);
};

exports.testEq = function () {
    var foo = {}, bar = {}, baz = {};
    assert.isTrue(util.eq([foo, bar, baz], [foo, bar, baz]));
    assert.isTrue(util.eq([baz, bar, foo], [foo, bar, baz]));
};

exports.testLt = function () {
    assert.isTrue(util.lt([10, 10, 0], [10, 10, 1]));
};

exports.testLtRagged = function () {
    assert.isTrue(util.lt([10, 10], [10, 10, 10]));
};

exports.testLtLexicographic = function () {
    assert.isTrue(util.lt(['1'], ['10']));
};

exports.testRepr = function () {
    assert.eq('[1, 2, 3]', util.repr([1,2,3]));
    assert.eq('["1"]', util.repr(["1"]));
};

/*
exports.testForEach = function () {
};

exports.testForEachApply = function () {
};

exports.testMap = function () {
};

exports.testMapApply = function () {
};

exports.testEvery = function () {
};

exports.testSome = function () {
};

exports.testAll = function () {
};

exports.testAny = function () {
};

exports.testReduce = function () {
};

exports.testReduceRight = function () {
};

exports.testZip = function () {
};

exports.testTranspose = function () {
};

exports.testEnumerate = function () {
};

exports.testRange = function () {
};

exports.testBy = function () {
};

exports.testSort = function () {
};

exports.testSorted = function () {
};
*/

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

