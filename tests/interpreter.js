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
    
    ASSERT.eq(c.eval("(this)"), c.global);
    
    ASSERT.isTrue(c.eval("(function(){ return this; })() === this"));
}

exports.testContextDifferentPrimordials = function() {
    var c = new Context();
    
    ASSERT.eq(c.eval("(function(){ return this; })()"), c.global);
    
    ASSERT.eq(c.eval("(this)"), c.global);
    
    ASSERT.isTrue(c.eval("(function(){ return this; })() === this"));
}

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));
