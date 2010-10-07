
var assert = require("test/assert");
var util = require("narwhal/util");

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

exports.testArrayPolymorphicToArray = function () {
    var Type = function () {
    };
    Type.prototype.toArray = function () {
        return [1];
    };
    assert.eq([1], util.array(new Type()));
};

exports.testArrayPolymorphicToArrayNegative = function () {
    var toArray = function () {};
    assert.eq([["toArray", toArray]], util.array({
        "toArray": toArray
    }));
};

exports.testArrayPolymorphicForEach = function () {
    var Type = function () {
    };
    Type.prototype.forEach = function (block) {
        block(1);
    };
    assert.eq([1], util.array(new Type()));
};

exports.testArrayPolymorphicForEachNegative = function () {
    var forEach = function () {};
    assert.eq([["forEach", forEach]], util.array({
        "forEach": forEach
    }));
};

exports.testIsArguments = require("./array/is-arguments");
exports.testIsArrayLike = require("./array/is-array-like");

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
*/

exports.testForEachApplyPolymorphicForEach = function () {
    var Type = function () {
    };
    Type.prototype.forEach = function (block) {
        block([1]);
    };
    var collect = [];
    util.forEachApply(new Type(), function (n) {
        collect.push(n);
    });
    assert.eq([1], collect);
};

/*
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
*/

exports.testZip = function () {
    assert.eq([[1,"a"],[2,"b"]], util.zip([1,2], "abc"));
};

/*
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

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

