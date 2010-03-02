---
layout: default
title: "test"
---

Testing
=======

Narwhal supports the [CommonJS Unit Test API
1.0](http://wiki.commonjs.org/wiki/Unit_Testing/1.0).  You can run any unit
test script with the `"js -m test"` command.

    js -m test tests/all-tests.js

Some tests include a snippet on the bottom that allows them to self-run, in
which case it is sufficient to run the script directly.

    js tests/all-tests.js

The boilerplate looks like this:

    if (require.main == module)
        require("os").exit(require("test").run(exports));

You can construct your own unit tests by creating a JavaScript module that
exports `test*` functions, and uses the `assert` module to throw an
`AssertionError` if a test fails.

    exports.testFoo = function () {
        assert.ok(true);
        assert.equals(2 + 2, 5, "three sir!");
    };

Alternately, if you prefer a test to continue running all test points even
after one of the assertions fails, you can use the logging assertion mechansim,
which is an `assert` object with the same API as the assert module that
gets quietly passed to your test functions.  It is a different logger object
for each module.

    exports['test my feature'] = function (assert) {
        assert.ok(false);
        assert.ok(true);
    };

Customization
-------------

The CommonJS Unit Testing specification codifies a very small subset of the
components you need for a unit testing framework, so that multiple frameworks
can run interoperably.  Two of the other pluggable parts are the test logging
system and custom syntactic sugar for advanced assertions.

### Logging

To have the test runner direct logs to an alternate system, pass an alternate
logger object to the `test` module's `run` method.

    require("test").run(exports, new Log());

The logger object needs to conform to the logger API set out in the `test`
module.  That involves providing implementations of the following function
properties:

 * `pass(message_opt)`
 * `fail(assertion)`
 * `error(exception)`
 * `section(name:String):Log`

The assertion object has the following properties:

 * `name` `AssertionError`
 * `message`
 * `actual`
 * `expected`
 * `operator`

### Assertions

You can create complex assertions by providing functions that can throw
`AssertionError`.  One fashionable technique is to provide a chaining API.

    expect(x).is(y);

To enable this simple case:

    var assert = require("assert");

    var expect = function (actual) {
        var self = {};
        self.is = function (expected, message) {
            if (!is(expected, actual)) {
                throw new assert.AssertionError({
                    "expected": expected,
                    "actual": actual,
                    "message": message,
                    "operator": "is"
                });
            }
        };
        return self;
    };

    // from Caja
    function is(x, y) {
        if (x === y) {
            return x !== 0 || 1/x === 1/y;
        } else {
            return x !== x && y !== y;
        }
    }

