
var assert = require("test/assert");
var util = require("util");

exports.test = function () {
    assert.eq([3, 2, 1], util.unique([3, 2, 3, 1, 2, 3]));
    assert.eq(['toString', 'hasOwnProperty'], util.unique(['toString', 'hasOwnProperty']));
};

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

