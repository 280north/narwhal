var assert = require("test/assert");

var Binary = require("binary").Binary,
    ByteString = require("binary").ByteString,
    ByteArray = require("binary").ByteArray;

exports.testByteArrayConstructor = function() {
}

exports.testByteArrayResizing = function() {
    var b1 = new ByteArray([0,1,2,3,4,5,6]);
    assert.isEqual(7, b1.length);
    assert.isTrue(isNaN(b1.get(7)));
    
    b1.length = 10;
    assert.isEqual(10, b1.length);
    assert.isEqual(5, b1.get(5));
    assert.isEqual(0, b1.get(7));
    
    b1.length = 3;
    assert.isEqual(3, b1.length);
    assert.isEqual(0, b1.get(0));
    assert.isTrue(isNaN(b1.get(4)));
    
    b1.length = 10;
    assert.isEqual(10, b1.length);
    assert.isEqual(0, b1.get(0));
    assert.isEqual(0, b1.get(4));
}

exports.testByteArrayReverse = function() {
    var testArray = [0,1,2,3,4,5,6];
    
    var b1 = new ByteArray(testArray),
        b2 = b1.reverse();
    
    assert.isEqual(b1, b2);
    assert.isEqual(b1.length, b2.length);
    for (var i = 0; i < testArray.length; i++)
        assert.isEqual(testArray[i], b2.get(testArray.length-i-1));

    testArray = [0,1,2,3,4,5,6,7];

    b1 = new ByteArray(testArray);
    b2 = b1.reverse();

    assert.isEqual(b1, b2);
    assert.isEqual(b1.length, b2.length);
    for (var i = 0; i < testArray.length; i++)
        assert.isEqual(testArray[i], b2.get(testArray.length-i-1));
}

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
