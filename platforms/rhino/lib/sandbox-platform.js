
/* shared, sealed global context */

var blacklist = [
    'Packages',
    'java',
    'javax',
    'org',
    'net',
    'com',
    'edu',
    'JavaAdapter',
    'JavaImporter',
    'getClass'
];

var whitelist = [
    'Array',
    'Boolean',
    'Date',
    'Error',
    'EvalError',
    'Function',
    'Math',
    'Number',
    'Object',
    'RangeError',
    'ReferenceError',
    'InternalError',
    'RegExp',
    'String',
    'SyntaxError',
    'TypeError',
    'URIError',
    'Infinity',
    'NaN',
    'undefined',
    'decodeURI',
    'decodeURIComponent',
    'encodeURI',
    'encodeURIComponent',
    'eval',
    'isFinite',
    'isNaN',
    'parseFloat',
    'parseInt'
];

var context = new Packages.org.mozilla.javascript.Context();
var global = context.initStandardObjects(null, true);
for (var i = 0; i < blacklist.length; i++)
    delete global[blacklist[i]];
seal(global);


/* create module factories */

exports.evaluate = function (text, id) {
    // verify that the script is a program by compiling it as such
    context.compileString(text, id, 1, null);
    // return a module factory function instead though.
    return context.compileFunction(
        global,
        "function(require,exports,module,system,print){"+text+"}",
        id,
        1,
        null
    );
};

