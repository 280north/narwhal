var equiv = require("./equiv").equiv,
    jsDump = require("./jsdump").jsDump;

var assert = exports;

function fail(message) {
    throw new AssertionError(message);
}

assert.isTrue = function(assertion, message) {
    if (assertion !== true)
        fail((message || "") + "\nExpected true." +
            "\nActual = " + assertion);
}

assert.isEqual = function(expected, actual, message) {
    if (expected !== actual)
        fail((message || "") + "\nExpected equal to = " + jsDump.parse(expected) +
            "\nActual = " + jsDump.parse(actual));
}

assert.isSame = function(expected, actual, message) {
    if (!equiv(expected, actual))
        fail((message || "") + "\nExpected same as = " + jsDump.parse(expected) +
            "\nActual = " + jsDump.parse(actual));
}

assert.isDiff = function(expected, actual, message) {
    if (equiv(expected, actual))
        fail((message || "") + "\nExpected different than = " + jsDump.parse(expected) +
            "\nActual = " + jsDump.parse(actual));
}

assert.throwsError = function(block, type, message) {
    var threw = false,
        exception = null;
        
    try {
        block();
    } catch (e) {
        threw = true;
        exception = e;
    }
    
    if (!threw)
        fail("Expected exception" + (message ? ": " + message : ""));
    
    if (type !== undefined && !(exception instanceof type))
        fail("Expected exception type '"+type+
            "', actually '"+exception+"'" + (message ? ": " + message : ""));
}


var AssertionError = exports.AssertionError = function(message) {
    this.name = "AssertionError";
    this.message = message;
}

AssertionError.prototype = new Error();
