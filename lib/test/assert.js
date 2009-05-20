var assert = exports;

assert.isTrue = function(assertion, message) {
    if (assertion !== true)
        throw new AssertionError("Expected true, actually '" + assertion +
            "'" + (message ? ": " + message : ""));
}

assert.isEqual = function(expected, actual, message) {
    if (expected !== actual)
        throw new AssertionError("Expected '" + expected +
            "', actually '" + actual + "'" + (message ? ": " + message : ""));
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
        throw new AssertionError("Expected exception" + (message ? ": " + message : ""));
    
    if (type !== undefined && !(exception instanceof type))
        throw new AssertionError("Expected exception type '"+type+
            "', actually '"+exception+"'" + (message ? ": " + message : ""));
}


var AssertionError = exports.AssertionError = function(message) {
    this.name = "AssertionError";
    this.message = message;
}

AssertionError.prototype = new Error();
