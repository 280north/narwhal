var url = 'chrome://narwhal/context/sandbox.js';
var global = Components.utils.Sandbox(url);

/* create module factories */
exports.evaluate = function (text, id) {
    return Components.utils.evalInSandbox('function(require,exports,system) {' + text + '}', global, "1.8", id, 1);
};

