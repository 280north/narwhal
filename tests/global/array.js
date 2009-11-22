
var assert = require('test/assert');

exports.testIsArray = function () {
    assert.isTrue(Array.isArray([]));
};

exports.testIsArrayNegativeArguments = function () {
    var args = (function () {return arguments})();
    assert.isFalse(Array.isArray(args));
};

exports.testIsArrayNegativeObject = function () {
    assert.isFalse(Array.isArray({"length": 0}));
};

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

