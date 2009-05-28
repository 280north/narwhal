var assert = require("test/assert");

exports.testModuleCharsetIsUtf8 = function () {
    assert.isEqual(
        1, "♥".length,
        'unicode characters should have length of 1'
    );
};

