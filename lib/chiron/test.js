/*file chiron src/test.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

/*status works, tested in Firefox and Safari, requires documentation */

"use iojs";

var base = require('./base');

/*** assert */
exports.assert = function (condition, message) {
    base.print(
        (condition ? 'PASS' : 'FAIL') + 
        (base.no(message) ? '' : ': ' + message),
        (condition ? 'pass' : 'fail')
    );
    return condition;
};

/*** assertEq */
exports.assertEq = function (actual, oracle, message) {
    var condition = base.eq(actual, oracle);
    exports.assert(condition, message);
    if (!condition) {
        base.print("actual: " + base.repr(actual));
        base.print("oracle: " + base.repr(oracle));
    }
    return condition;
};

/*** assertNe */
exports.assertNe = function (actual, oracle, message) {
    var condition = base.ne(actual, oracle)
    exports.assert(condition, message);
    if (!condition) {
        base.print("actual: not " + base.repr(actual));
        base.print("oracle: " + base.repr(oracle));
    }
};

/*** assertError */
exports.assertError = function (guard, Exception, message) {
    var condition = false;
    var error;
    try {
        guard();
    } catch (exception) {
        error = exception;
        if (base.no(Exception)) {
            condition = true;
        } else {
            if (base.isInstance(exception, Exception)) {
                condition = true;
            }
        }
    }
    exports.assert(condition, message);
    if (error && !base.isInstance(error, Exception)) {
        base.print('WARN: Incorrect exception type', 'warn');
        base.print('oracle: ' + base.repr(Exception));
        base.print('actual: ' + base.repr(error));
    }
    /* todo report failed exception types */
}

/*** assertNoError */
exports.assertNoError = function (guard, message) {
    var error;
    try {
        guard();
    } catch (exception) {
        error = exception;
    }
    exports.assert(!error, message);
    if (error) 
        base.print('Error: ' + (error.message || error), 'error');
    /* todo report failed exception types */
}

/*** time */
exports.time = function () {
    var continuation, message;

    if (arguments.length == 1) {
        continuation = arguments[0];
    } else if (arguments.length == 2) {
        message = arguments[0];
        continuation = arguments[1];
    }

    var start = new Date().getTime();
    if (base.isInstance(continuation, Function)) {
        continuation();
    } else {
        throw new Error("Could not time a " + base.getTypeName(continuation));
    }
    var stop = new Date().getTime();
    var run = stop - start;
    if (message) {
        base.print(message + ': ' + run + 'ms', 'info');
    } else {
        base.print('time: ' + run + 'ms', 'info');
    }
    return run;
};


/*license

    Legal
    =======
    
    Chiron is a component of the Tale web-game project.
    
    See <credit.txt> for a complete list of
    contributions and their licenses.  All contributions are provided
    under permissive, non-viral licenses including MIT, BSD, Creative Commons
    Attribution 2.5, Public Domain, or Unrestricted.
    
    
    License
    =======
    
    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    
    MIT License
    -----------
    
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.

*/

