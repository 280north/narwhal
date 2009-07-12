var assert = require("test/assert");

var Binary = require("binary").Binary,
    ByteString = require("binary").ByteString,
    ByteArray = require("binary").ByteArray;

exports.testByteStringConstructor = function() {
    var testArray = [1,2,3,4];
    
    // ByteString()
    // Construct an empty byte string.
    var b1 = new ByteString();
    //assert.isTrue(b1 instanceof Binary, "not instanceof Binary");
    assert.isTrue(b1 instanceof ByteString, "not instanceof ByteString");
    assert.isEqual(0, b1.length);
    b1.length = 123;
    assert.isEqual(0, b1.length);
    
    // ByteString(byteString)
    // Copies byteString.
    var b2 = new ByteString(new ByteString(testArray));
    assert.isEqual(testArray.length, b2.length);
    b2.length = 123;
    assert.isEqual(testArray.length, b2.length);
    assert.isEqual(1, b2.get(0));
    assert.isEqual(4, b2.get(3));
    
    // ByteString(byteArray)
    // Use the contents of byteArray.
    var b2 = new ByteString(new ByteArray(testArray));
    assert.isEqual(testArray.length, b2.length);
    b2.length = 123;
    assert.isEqual(testArray.length, b2.length);
    assert.isEqual(1, b2.get(0));
    assert.isEqual(4, b2.get(3));
    
    // ByteString(arrayOfNumbers)
    // Use the numbers in arrayOfNumbers as the bytes.
    // If any element is outside the range 0...255, an exception (TODO) is thrown.
    var b3 = new ByteString(testArray);
    assert.isEqual(testArray.length, b3.length);
    b3.length = 123;
    assert.isEqual(testArray.length, b3.length);
    assert.isEqual(1, b3.get(0));
    assert.isEqual(4, b3.get(3));
    
    // ByteString(string, charset)
    // Convert a string. The ByteString will contain string encoded with charset.
    var testString = "hello world";
    var b4 = new ByteString(testString, "US-ASCII");
    assert.isEqual(testString.length, b4.length);
    b4.length = 123;
    assert.isEqual(testString.length, b4.length);
    assert.isEqual(testString.charCodeAt(0), b4.get(0));
    assert.isEqual(testString.charCodeAt(testString.length-1), b4.get(testString.length-1));
}

//exports.testByteStringJoin = function() {
//}

exports.testToByteArray = function() {
    var b1 = new ByteString([1,2,3]),
        b2 = b1.toByteArray();
        
    assert.isTrue(b2 instanceof ByteArray, "not instanceof ByteArray");
    assert.isEqual(b1.length, b2.length);
    assert.isEqual(b1.get(0), b2.get(0));
    assert.isEqual(b1.get(2), b2.get(2));
    
    var testString = "I ♥ JS";
    assert.isEqual(testString, new ByteString(testString, "UTF-8").toByteArray("UTF-8", "UTF-16").decodeToString("UTF-16"));
}

exports.testToByteString = function() {
    var b1 = new ByteString([1,2,3]),
        b2 = b1.toByteString();
        
    assert.isEqual(b1.length, b2.length);
    assert.isEqual(b1.get(0), b2.get(0));
    assert.isEqual(b1.get(2), b2.get(2));
    
    var testString = "I ♥ JS";
    assert.isEqual(testString, new ByteString(testString, "UTF-8").toByteString("UTF-8", "UTF-16").decodeToString("UTF-16"));
}

exports.testToArray = function() {
    var testArray = [0,1,254,255],
        b1 = new ByteString(testArray),
        a1 = b1.toArray();
          
    assert.isEqual(testArray.length, a1.length);
    for (var i = 0; i < testArray.length; i++)
        assert.isEqual(testArray[i], a1[i]);
    
    a1 = new ByteString("\u0024\u00A2\u20AC", "UTF-8").toArray("UTF-8");
    assert.isEqual(3, a1.length);
    assert.isEqual(0x24, a1[0]);
    assert.isEqual(0xA2, a1[1]);
    assert.isEqual(0x20AC, a1[2]);
    
    a1 = new ByteString("\u0024\u00A2\u20AC", "UTF-16").toArray("UTF-16");
    assert.isEqual(3, a1.length);
    assert.isEqual(0x24, a1[0]);
    assert.isEqual(0xA2, a1[1]);
    assert.isEqual(0x20AC, a1[2]);
}

exports.testToString = function() {
    // the format of the resulting string isn't specified, but it shouldn't be the decoded string
    // TODO: is this an ok test?
    
    var testString = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    
    var resultString = new ByteString(testString, "US-ASCII").toString();
    
    assert.isTrue(resultString.length < 100);
    assert.isTrue(resultString !== testString);
}

exports.testDecodeToString = function() {
    assert.isEqual("hello world", new ByteString("hello world", "US-ASCII").decodeToString("US-ASCII"));
    
    assert.isEqual("I ♥ JS", new ByteString("I ♥ JS", "UTF-8").decodeToString("UTF-8"));
    
    assert.isEqual("\u0024", new ByteString([0x24]).decodeToString("UTF-8"));
    assert.isEqual("\u00A2", new ByteString([0xC2,0xA2]).decodeToString("UTF-8"));
    assert.isEqual("\u20AC", new ByteString([0xE2,0x82,0xAC]).decodeToString("UTF-8"));
    // FIXME:
    //assert.isEqual("\u10ABCD", (new ByteString([0xF4,0x8A,0xAF,0x8D])).decodeToString("UTF-8"));
    
    assert.isEqual("\u0024", new ByteString("\u0024", "UTF-8").decodeToString("UTF-8"));
    assert.isEqual("\u00A2", new ByteString("\u00A2", "UTF-8").decodeToString("UTF-8"));
    assert.isEqual("\u20AC", new ByteString("\u20AC", "UTF-8").decodeToString("UTF-8"));
    assert.isEqual("\u10ABCD", new ByteString("\u10ABCD", "UTF-8").decodeToString("UTF-8"));
    
    assert.isEqual("\u0024", new ByteString("\u0024", "UTF-16").decodeToString("UTF-16"));
    assert.isEqual("\u00A2", new ByteString("\u00A2", "UTF-16").decodeToString("UTF-16"));
    assert.isEqual("\u20AC", new ByteString("\u20AC", "UTF-16").decodeToString("UTF-16"));
    assert.isEqual("\u10ABCD", new ByteString("\u10ABCD", "UTF-16").decodeToString("UTF-16"));
}

exports.testIndexOf = function() {
    var b1 = new ByteString([0,1,2,3,4,5,0,1,2,3,4,5]);
    
    assert.isEqual(-1, b1.indexOf(-1));
    
    assert.isEqual(0,  b1.indexOf(0));
    assert.isEqual(5,  b1.indexOf(5));
    assert.isEqual(-1, b1.indexOf(12));
    
    assert.isEqual(6,  b1.indexOf(0, 6));
    assert.isEqual(11,  b1.indexOf(5, 6));
    assert.isEqual(-1, b1.indexOf(12, 6));
    
    assert.isEqual(0,  b1.indexOf(0, 0, 3));
    assert.isEqual(-1,  b1.indexOf(5, 0, 3));
    assert.isEqual(-1, b1.indexOf(12, 0, 3));
}

exports.testLastIndexOf = function() {
    var b1 = new ByteString([0,1,2,3,4,5,0,1,2,3,4,5]);

    assert.isEqual(-1, b1.lastIndexOf(-1));

    assert.isEqual(6,  b1.lastIndexOf(0));
    assert.isEqual(11,  b1.lastIndexOf(5));
    assert.isEqual(-1, b1.lastIndexOf(12));

    assert.isEqual(0,  b1.lastIndexOf(0, 0, 6));
    assert.isEqual(5,  b1.lastIndexOf(5, 0, 6));
    assert.isEqual(-1, b1.lastIndexOf(12, 0, 6));

    assert.isEqual(6,  b1.lastIndexOf(0, 6, 9));
    assert.isEqual(-1,  b1.lastIndexOf(5, 6, 9));
    assert.isEqual(-1, b1.lastIndexOf(12, 6, 9));
}

exports.testCharCodeAt = function() {
    var b1 = new ByteString([0,1,2,3,4,255]);
    
    assert.isTrue(isNaN(b1.charCodeAt(-1)));
    assert.isEqual(0, b1.charCodeAt(0));
    assert.isEqual(255, b1.charCodeAt(5));
    assert.isTrue(isNaN(b1.charCodeAt(6)));
}

// identical to charCodeAt, test anyway?
exports.testGet = function() {
    var b1 = new ByteString([0,1,2,3,4,255]);

    assert.isTrue(isNaN(b1.get(-1)));
    assert.isEqual(0, b1.get(0));
    assert.isEqual(255, b1.get(5));
    assert.isTrue(isNaN(b1.get(6)));
}

exports.testByteAt = function() {
    var b1 = new ByteString([0,1,2,3,4,255]), b2;

    b2 = b1.byteAt(-1);
    assert.isEqual(0, b2.length);
    b2 = b1.byteAt(0);
    assert.isEqual(1, b2.length);
    assert.isEqual(0, b2.get(0));
    b2 = b1.byteAt(5);
    assert.isEqual(1, b2.length);
    assert.isEqual(255, b2.get(0));
    b2 = b1.byteAt(6);
    assert.isEqual(0, b2.length);
}

// identical to byteAt, test anyway?
exports.testCharAt = function() {
    var b1 = new ByteString([0,1,2,3,4,255]), b2;

    b2 = b1.charAt(-1);
    assert.isEqual(0, b2.length);
    b2 = b1.charAt(0);
    assert.isEqual(1, b2.length);
    assert.isEqual(0, b2.get(0));
    b2 = b1.charAt(5);
    assert.isEqual(1, b2.length);
    assert.isEqual(255, b2.get(0));
    b2 = b1.charAt(6);
    assert.isEqual(0, b2.length);
}

exports.testSplit = function() {
    var b1 = new ByteString([0,1,2,3,4,5]), a1;
    
    a1 = b1.split([]);
    assert.isEqual(1, a1.length);
    assert.isTrue(a1[0] instanceof ByteString);
    assert.isEqual(6, a1[0].length);
    assert.isEqual(0, a1[0].get(0));
    assert.isEqual(5, a1[0].get(5));
    
    a1 = b1.split([2]);
    assert.isEqual(2, a1.length);
    assert.isTrue(a1[0] instanceof ByteString);
    assert.isEqual(2, a1[0].length);
    assert.isEqual(0, a1[0].get(0));
    assert.isEqual(1, a1[0].get(1));
    assert.isEqual(3, a1[1].length);
    assert.isEqual(3, a1[1].get(0));
    assert.isEqual(5, a1[1].get(2));
    
    a1 = b1.split([2], { includeDelimiter : true });
    assert.isEqual(3, a1.length);
    assert.isTrue(a1[0] instanceof ByteString);
    assert.isEqual(2, a1[0].length);
    assert.isEqual(0, a1[0].get(0));
    assert.isEqual(1, a1[0].get(1));
    assert.isEqual(1, a1[1].length);
    assert.isEqual(2, a1[1].get(0));
    assert.isEqual(3, a1[2].length);
    assert.isEqual(3, a1[2].get(0));
    assert.isEqual(5, a1[2].get(2));
    
    a1 = b1.split(new ByteString([2,3]));
    assert.isEqual(2, a1.length);
    assert.isTrue(a1[0] instanceof ByteString);
    assert.isEqual(2, a1[0].length);
    assert.isEqual(0, a1[0].get(0));
    assert.isEqual(1, a1[0].get(1));
    assert.isEqual(2, a1[1].length);
    assert.isEqual(4, a1[1].get(0));
    assert.isEqual(5, a1[1].get(1));
}

exports.testSlice = function() {
    var b1 = new ByteString([0,1,2,3,4,5]), b2;
    
    b2 = b1.slice();
    assert.isEqual(6, b2.length);
    assert.isEqual(0, b2.get(0));
    assert.isEqual(5, b2.get(5));
    
    b2 = b1.slice(0);
    assert.isEqual(6, b2.length);
    assert.isEqual(0, b2.get(0));
    assert.isEqual(5, b2.get(5));
    
    b2 = b1.slice(1, 4);
    assert.isEqual(3, b2.length);
    assert.isEqual(1, b2.get(0));
    assert.isEqual(3, b2.get(2));
    
    b2 = b1.slice(0, -1);
    assert.isEqual(5, b2.length);
    assert.isEqual(0, b2.get(0));
    assert.isEqual(4, b2.get(4));
    
    b2 = b1.slice(-3, -1);
    assert.isEqual(2, b2.length);
    assert.isEqual(3, b2.get(0));
    assert.isEqual(4, b2.get(1));
    
    b2 = b1.slice(9, 10);
    assert.isEqual(0, b2.length);
}

exports.testStringToByteString = function() {
    assert.isEqual("hello world", "hello world".toByteString("US-ASCII").decodeToString("US-ASCII"));
    assert.isEqual("I ♥ JS", "I ♥ JS".toByteString("UTF-8").decodeToString("UTF-8"));
};

exports.testByteStringNewless = function () {
    assert.isEqual(1, ByteString([0]).length);
    assert.isEqual(2, ByteString([0, 1], 0, 2).length);
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

