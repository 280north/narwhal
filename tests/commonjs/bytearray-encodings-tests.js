var assert = require("test/assert");

var Binary = require("binary").Binary,
    ByteString = require("binary").ByteString,
    ByteArray = require("binary").ByteArray;

exports.testByteArrayConstructorEncodings = function() {
    // ByteString(string, charset)
    // Convert a string. The ByteString will contain string encoded with charset.
    var testString = "hello world";
    var b = new ByteArray(testString, "US-ASCII");
    assert.isEqual(testString.length, b.length);
    b.length = 678;
    assert.isEqual(678, b.length);
    assert.isEqual(testString.charCodeAt(0), b.get(0));
    assert.isEqual(testString.charCodeAt(testString.length-1), b.get(testString.length-1));
    assert.isEqual(0, b.get(677));
};

exports.testToByteArrayEncodings = function() {
    var testString = "I ♥ JS";
    assert.isEqual(testString, new ByteArray(testString, "UTF-8").toByteArray("UTF-8", "UTF-16").decodeToString("UTF-16"));
};

exports.testToByteStringEncodings = function() {
    var testString = "I ♥ JS";
    assert.isEqual(testString, new ByteArray(testString, "UTF-8").toByteString("UTF-8", "UTF-16").decodeToString("UTF-16"));
};

exports.testToArrayEncodings = function() {
    var a1;
    
    a1 = new ByteArray("\u0024\u00A2\u20AC", "UTF-8").toArray("UTF-8");
    assert.isEqual(3, a1.length);
    assert.isEqual(0x24, a1[0]);
    assert.isEqual(0xA2, a1[1]);
    assert.isEqual(0x20AC, a1[2]);
    
    a1 = new ByteArray("\u0024\u00A2\u20AC", "UTF-16").toArray("UTF-16");
    assert.isEqual(3, a1.length);
    assert.isEqual(0x24, a1[0]);
    assert.isEqual(0xA2, a1[1]);
    assert.isEqual(0x20AC, a1[2]);
};

exports.testDecodeToString = function() {
    assert.isEqual("hello world", new ByteArray("hello world", "US-ASCII").decodeToString("US-ASCII"));
    
    assert.isEqual("I ♥ JS", new ByteArray("I ♥ JS", "UTF-8").decodeToString("UTF-8"));
    
    assert.isEqual("\u0024", new ByteArray([0x24]).decodeToString("UTF-8"));
    assert.isEqual("\u00A2", new ByteArray([0xC2,0xA2]).decodeToString("UTF-8"));
    assert.isEqual("\u20AC", new ByteArray([0xE2,0x82,0xAC]).decodeToString("UTF-8"));
    // FIXME:
    //assert.isEqual("\u10ABCD", (new ByteArray([0xF4,0x8A,0xAF,0x8D])).decodeToString("UTF-8"));
    
    assert.isEqual("\u0024", new ByteArray("\u0024", "UTF-8").decodeToString("UTF-8"));
    assert.isEqual("\u00A2", new ByteArray("\u00A2", "UTF-8").decodeToString("UTF-8"));
    assert.isEqual("\u20AC", new ByteArray("\u20AC", "UTF-8").decodeToString("UTF-8"));
    assert.isEqual("\u10ABCD", new ByteArray("\u10ABCD", "UTF-8").decodeToString("UTF-8"));
    
    assert.isEqual("\u0024", new ByteArray("\u0024", "UTF-16").decodeToString("UTF-16"));
    assert.isEqual("\u00A2", new ByteArray("\u00A2", "UTF-16").decodeToString("UTF-16"));
    assert.isEqual("\u20AC", new ByteArray("\u20AC", "UTF-16").decodeToString("UTF-16"));
    assert.isEqual("\u10ABCD", new ByteArray("\u10ABCD", "UTF-16").decodeToString("UTF-16"));
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
