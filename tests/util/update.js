var assert = require("test/assert");
var util = require("narwhal/util");

exports["test returns updated object"] = function() {
    var obj = {};
    var obj2 = { hello: "world" };

    var result = util.update(obj, obj2);

    assert.eq(result, obj);
};

exports["test is variadic"] = function() {
    var obj = util.update({}, { a: 1 }, { b: 2});

    assert.eq(1, obj.a);
    assert.eq(2, obj.b);
};

exports["test last in wins for multiple sources"] = function() {
    var obj = util.update({}, { a: 1 }, { a: 2});

    assert.eq(2, obj.a);
};

if (module.id == require.main)
    require("test/runner").run(exports);
