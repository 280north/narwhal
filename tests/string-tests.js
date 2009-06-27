var assert = require("test/assert");

exports.testSqueze = function() {
    assert.isEqual("", "".squeeze());
    assert.isEqual("ok", "ok".squeeze());
    assert.isEqual("it works", "it  works".squeeze());
    assert.isEqual("start", "ssstart".squeeze());
    assert.isEqual("end\n", "end\n\n\n".squeeze());
}

exports.testChomp = function() {
    assert.isEqual("hello", "hello".chomp());
    assert.isEqual("hello", "hello\n".chomp());
    assert.isEqual("hello", "hello\r\n".chomp());
    assert.isEqual("hello", "hello\n\r".chomp()); // FIXME: should fail!!! (== hello\n)
    assert.isEqual("hello", "hello\r".chomp());
    assert.isEqual("hello \n there", "hello \n there".chomp());
    assert.isEqual("he", "hello".chomp("llo"));
}

