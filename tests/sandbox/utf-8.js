var assert = require("test/assert");

exports.testModuleCharsetIsUtf8 = function () {
    assert.equal(
        1, "♥".length,
        'unicode characters should have length of 1'
    );
};

