var assert = require("test/assert");

var sha256 = require("sha256");

exports.testHash = function() {
    // the returned hash should stay constant for the same input.
    var s1 = sha256.hash("test").decodeToString(64);
    var s2 = sha256.hash("test").decodeToString(64);
    assert.isEqual(s1, s2);
}
