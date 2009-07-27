
var assert = require('test/assert');
var fs = require('file');

exports.testIsAbsolute = function () {
    assert.eq(true, fs.isAbsolute(fs.absolute(module.path)), 'absolute module path is absolute');
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

