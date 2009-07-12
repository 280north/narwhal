var assert = require("test/assert");

var Binary = require("binary").Binary,
    ByteString = require("binary").ByteString,
    ByteArray = require("binary").ByteArray;

exports.testByteArrayConstructor = function() {
    var testArray = [1,2,3,4],
        b;
    
    // ByteArray()
    // New, empty ByteArray.
    b = new ByteArray();
    //assert.isTrue(b instanceof Binary, "not instanceof Binary");
    assert.isTrue(b instanceof ByteArray, "not instanceof ByteArray");
    assert.isEqual(0, b.length);
    b.length = 123;
    assert.isEqual(123, b.length);
    assert.isEqual(0, b.get(4));
    
    // ByteArray(length)
    // New ByteArray filled with length zero bytes.
    b = new ByteArray(10);
    assert.isEqual(10, b.length);
    for (var i = 0; i < 10; i++)
        assert.isEqual(0, b.get(i));
    assert.isNaN(b.get(10));
    b.length = 234;
    assert.isEqual(234, b.length);
    assert.isEqual(0, b.get(10));
    assert.isEqual(0, b.get(233));
    assert.isNaN(b.get(234));
    
    // ByteArray(byteString)
    // Copy contents of byteString.
    b = new ByteArray(new ByteString(testArray));
    assert.isEqual(testArray.length, b.length);
    b.length = 345;
    assert.isEqual(345, b.length);
    assert.isEqual(1, b.get(0));
    assert.isEqual(4, b.get(3));
    assert.isEqual(0, b.get(4));
    
    // ByteArray(byteArray)
    // Copy byteArray.
    b = new ByteArray(new ByteArray(testArray));
    assert.isEqual(testArray.length, b.length);
    b.length = 456;
    assert.isEqual(456, b.length);
    assert.isEqual(1, b.get(0));
    assert.isEqual(4, b.get(3));
    assert.isEqual(0, b.get(4));
    
    // ByteArray(arrayOfBytes)
    // Use numbers in arrayOfBytes as contents.
    // Throws an exception if any element is outside the range 0...255 (TODO).
    b = new ByteArray(testArray);
    assert.isEqual(testArray.length, b.length);
    b.length = 567;
    assert.isEqual(567, b.length);
    assert.isEqual(1, b.get(0));
    assert.isEqual(4, b.get(3));
    assert.isEqual(0, b.get(4));
    
    // ByteString(string, charset)
    // Convert a string. The ByteString will contain string encoded with charset.
    var testString = "hello world";
    b = new ByteArray(testString, "US-ASCII");
    assert.isEqual(testString.length, b.length);
    b.length = 678;
    assert.isEqual(678, b.length);
    assert.isEqual(testString.charCodeAt(0), b.get(0));
    assert.isEqual(testString.charCodeAt(testString.length-1), b.get(testString.length-1));
    assert.isEqual(0, b.get(677));
}

exports.testByteArrayResizing = function() {
    var b1 = new ByteArray([0,1,2,3,4,5,6]);
    assert.isEqual(7, b1.length);
    assert.isNaN(b1.get(7));
    
    b1.length = 10;
    assert.isEqual(10, b1.length);
    assert.isEqual(5, b1.get(5));
    assert.isEqual(0, b1.get(7));
    
    b1.length = 3;
    assert.isEqual(3, b1.length);
    assert.isEqual(0, b1.get(0));
    assert.isNaN(b1.get(4));
    
    b1.length = 10;
    assert.isEqual(10, b1.length);
    assert.isEqual(0, b1.get(0));
    assert.isEqual(0, b1.get(4));
}

exports.testToByteArray = function() {
    var b1 = new ByteArray([1,2,3]),
        b2 = b1.toByteArray();
        
    assert.isTrue(b2 instanceof ByteArray, "not instanceof ByteArray");
    assert.isEqual(b1.length, b2.length);
    assert.isEqual(b1.get(0), b2.get(0));
    assert.isEqual(b1.get(2), b2.get(2));
    
    assert.isEqual(1, b1.get(0));
    assert.isEqual(1, b2.get(0));
    
    b1.set(0, 10);
    
    assert.isEqual(10, b1.get(0));
    assert.isEqual(1, b2.get(0));
    
    var testString = "I ♥ JS";
    assert.isEqual(testString, new ByteArray(testString, "UTF-8").toByteArray("UTF-8", "UTF-16").decodeToString("UTF-16"));
}

exports.testToByteString = function() {
    var b1 = new ByteArray([1,2,3]),
        b2 = b1.toByteString();
        
    assert.isEqual(b1.length, b2.length);
    assert.isEqual(b1.get(0), b2.get(0));
    assert.isEqual(b1.get(2), b2.get(2));
    
    assert.isEqual(1, b1.get(0));
    assert.isEqual(1, b2.get(0));
    
    b1.set(0, 10);
    
    assert.isEqual(10, b1.get(0));
    assert.isEqual(1, b2.get(0));
    
    var testString = "I ♥ JS";
    assert.isEqual(testString, new ByteArray(testString, "UTF-8").toByteString("UTF-8", "UTF-16").decodeToString("UTF-16"));
}

exports.testToArray = function() {
    var testArray = [0,1,254,255],
        b1 = new ByteArray(testArray),
        a1 = b1.toArray();
          
    assert.isEqual(testArray.length, a1.length);
    for (var i = 0; i < testArray.length; i++)
        assert.isEqual(testArray[i], a1[i]);
    
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
}

exports.testToString = function() {
    // the format of the resulting string isn't specified, but it shouldn't be the decoded string
    // TODO: is this an ok test?
    
    var testString = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    
    var resultString = new ByteArray(testString, "US-ASCII").toString();
    
    assert.isTrue(resultString.length < 100);
    assert.isTrue(resultString !== testString);
}

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
}

exports.testIndexOf = function() {
    var b1 = new ByteArray([0,1,2,3,4,5,0,1,2,3,4,5]);
    
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
    var b1 = new ByteArray([0,1,2,3,4,5,0,1,2,3,4,5]);

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

exports.testByteArraySort = function() {
    var testArray = [];
    for (var i = 0; i < 1000; i++)
        testArray.push(Math.floor(Math.random()*256));

    var a = new ByteArray(testArray);
    a.sort();
    
    for (var i = 1; i < a.length; i++)
        assert.isTrue(a.get(i-1) <= a.get(i), "index="+i+"("+a.get(i-1)+","+a.get(i)+")");    
}

exports.testByteArraySortCustom = function() {
    var testArray = [];
    for (var i = 0; i < 1000; i++)
        testArray.push(Math.floor(Math.random()*256));

    var a = new ByteArray(testArray);
    a.sort(function(o1, o2) { return o2-o1; });

    for (var i = 1; i < a.length; i++)
        assert.isTrue(a.get(i-1) >= a.get(i), "index="+i+"("+a.get(i-1)+","+a.get(i)+")");
}

exports.testSplit = function() {
    var b1 = new ByteArray([0,1,2,3,4,5]), a1;
    
    a1 = b1.split([]);
    assert.isEqual(1, a1.length);
    assert.isTrue(a1[0] instanceof ByteArray);
    assert.isEqual(6, a1[0].length);
    assert.isEqual(0, a1[0].get(0));
    assert.isEqual(5, a1[0].get(5));
    
    a1 = b1.split([2]);
    assert.isEqual(2, a1.length);
    assert.isTrue(a1[0] instanceof ByteArray);
    assert.isEqual(2, a1[0].length);
    assert.isEqual(0, a1[0].get(0));
    assert.isEqual(1, a1[0].get(1));
    assert.isEqual(3, a1[1].length);
    assert.isEqual(3, a1[1].get(0));
    assert.isEqual(5, a1[1].get(2));
    
    a1 = b1.split([2], { includeDelimiter : true });
    assert.isEqual(3, a1.length);
    assert.isTrue(a1[0] instanceof ByteArray);
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
    assert.isTrue(a1[0] instanceof ByteArray);
    assert.isEqual(2, a1[0].length);
    assert.isEqual(0, a1[0].get(0));
    assert.isEqual(1, a1[0].get(1));
    assert.isEqual(2, a1[1].length);
    assert.isEqual(4, a1[1].get(0));
    assert.isEqual(5, a1[1].get(1));
}

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
