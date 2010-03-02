var ASSERT = require("test/assert");

var Context = require("interpreter").Context;

exports.testContextGlobalAssignment = function() {
    var c = new Context();

    ASSERT.isTrue(typeof global.foo === "undefined");
    ASSERT.isTrue(!c.global.foo);

    var testObj = {};

    c.global.foo = testObj;

    ASSERT.isTrue(typeof global.foo === "undefined");
    ASSERT.eq(testObj, c.global.foo);
    ASSERT.eq(testObj, c.eval("foo"));
    ASSERT.eq(testObj, (new c.Function("return foo;"))());
}

exports.testContextEval = function() {
    var c = new Context();

    ASSERT.isTrue(typeof global.foo === "undefined");
    ASSERT.isTrue(!c.global.foo);

    c.eval("foo = 1234;");

    ASSERT.isTrue(typeof global.foo === "undefined");
    ASSERT.eq(1234, c.global.foo);
    ASSERT.eq(1234, c.eval("foo"));
    ASSERT.eq(1234, (new c.Function("return foo;"))());
}

exports.testContextFunction = function() {
    var c = new Context();

    ASSERT.isTrue(typeof global.foo === "undefined");
    ASSERT.isTrue(!c.global.foo);

    var testObj = {};

    (new c.Function("bar", "foo = bar;"))(testObj);

    ASSERT.isTrue(typeof global.foo === "undefined");
    ASSERT.eq(testObj, c.global.foo);
    ASSERT.eq(testObj, c.eval("foo"));
    ASSERT.eq(testObj, (new c.Function("return foo;"))());
}

exports.testContextGlobal = function() {
    var c = new Context();

    ASSERT.eq(c.eval("(function(){ return this; })()"), c.global);

    ASSERT.eq(c.eval("this"), c.global);

    ASSERT.isTrue(c.eval("(function(){ return this; })() === this"));

    ASSERT.isTrue(global !== c.global, "Context global should be unique.");
}

exports.testContextPrimordials = function() {
    var c = new Context();

    var globalNames = [
        "Array", "Boolean", "Date", "Error", "EvalError", "Function",
        "Math", "Number", "Object", "RangeError", "ReferenceError",
        "RegExp", "String", "SyntaxError", "TypeError", "URIError",
        "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent",
        "eval", "isFinite", "isNaN", "parseFloat", "parseInt",
    ];

    globalNames.forEach(function(globalName) {
        ASSERT.isTrue(!!c.global[globalName], globalName + " global should exist");
        ASSERT.isTrue(c.global[globalName] !== global[globalName], globalName + " global should be different than parent Context's");
    });
}

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));
