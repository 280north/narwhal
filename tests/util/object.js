
var assert = require("test/assert");
var util = require("util");

exports.testObject = function () {
    assert.eq({"a": 10}, util.object({"a": 10}));
};

exports.testObjectNonInheritance = function () {
    var Foo = function () {
        this.a = 10;
    };
    Foo.prototype.bar = 10;
    assert.eq({"a": 10}, util.object(new Foo()));
};

exports.testObjectArray = function () {
    assert.eq({"a": 10, "b": 20}, util.object([["a", 10], ["b", 20]]));
    assert.eq({"1": 10, "2": 20}, util.object([[1, 10], [2, 20]]));
};

exports.testObjectPolymorphism = function () {
    var Foo = function () {
    };
    Foo.prototype.object = function () {
        return {"a": 10};
    };
    assert.eq({"a": 10}, util.object(new Foo()));
};

exports.testObjectNonPolymorphism = function () {
    assert.eq({"object": 10}, util.object({"object": 10}));
};

exports.testCopyShallow = function () {
    var foo = {"a": 10};
    var original = {"foo": foo};
    var copy = util.copy(original);
    assert.eq(original, copy);
    assert.isFalse(util.is(original, copy));
    assert.isTrue(util.is(original.foo, copy.foo));
    foo.a = 20;
    assert.eq(20, original.foo.a);
    assert.eq(20, copy.foo.a);
};

exports.testDeepCopy = function () {
    var foo = {"a": 10};
    var original = {"foo": foo};
    var copy = util.deepCopy(original);
    assert.eq(original, copy);
    assert.isFalse(util.is(original, copy));
    assert.isFalse(util.is(original.foo, copy.foo));
    foo.a = 20;
    assert.eq(20, original.foo.a);
    assert.eq(10, copy.foo.a);
};

exports.testEqCompleteness = function () {
    assert.isFalse(util.object.eq({"a": 10, "b": 20}, {"b": 20}));
    assert.isFalse(util.object.eq({"a": 10, "b": 20}, {"a": 10}));
    assert.isFalse(util.object.eq({"a": 10, "b": 20}, {"a": 10, "b": 20, "c": 30}));
};

exports.testEqOrderAgnostic = function () {
    assert.isTrue(util.object.eq({"a": 10, "b": 20}, {"b": 20, "a": 10}));
};

exports.testLen = function () {
    assert.eq(0, util.len({}));
    assert.eq(1, util.len({"a": 10}));
    assert.eq(2, util.len({"a": 10, "b": 20}));
    var Foo = function () {
        // len not in prototype, therefore not used by util.len
        this.len = function () {
            return 0;
        };
        this.a = 10;
    };
    Foo.prototype.b = 20;
    assert.eq(2, util.len(new Foo()));
};

exports.testHas = function () {
    assert.isTrue(util.has({"a": 10}, "a"));
    assert.isFalse(util.has({"b": 10}, "a"));
};

exports.testKeys = function () {
    assert.eq(["a", "b"], util.keys({"a": 10, "b": 20}));
    assert.eq(["b", "a"], util.keys({"b": 20, "a": 10}));
    var Foo = function () {
    };
    Foo.prototype.c = 30;
    assert.eq([], util.keys(new Foo()));
};

exports.testValues = function () {
    assert.eq([10, 20], util.values({"a": 10, "b": 20}));
    assert.eq([20, 10], util.values({"b": 20, "a": 10}));
};

exports.testItems = function () {
    assert.eq([["a", 10], ["b", 20]], util.items({"a": 10, "b": 20}));
    assert.eq([["b", 20], ["a", 10]], util.items({"b": 20, "a": 10}));
};

exports.testUpdate = function () {
    var object = {"a": 10, "b": 20};
    util.update(object, {"b": 30, "c": 40});
    assert.eq({"a": 10, "b": 30, "c": 40}, object);
};

exports.testComplete = function () {
    var object = {"a": 10, "b": 20};
    util.complete(object, {"b": 30, "c": 40});
    assert.eq({"a": 10, "b": 20, "c": 40}, object);
};

exports.testRepr = function () {
    assert.eq('{"a": 10}', util.repr({"a": 10}));
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
