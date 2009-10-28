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
};

exports.testByteArrayResizing = function() {
    var b1 = new ByteArray([0,1,2,3,4,5,6]);
    assert.isEqual(7, b1.length);
    assert.isNaN(b1.get(7));
    
    b1.length = 10;
    assert.isEqual(10, b1.length, "Length should change to 10");
    assert.isEqual(5, b1.get(5));
    assert.isEqual(0, b1.get(7));
    
    b1.length = 3;
    assert.isEqual(3, b1.length, "Length should change to 10");
    assert.isEqual(0, b1.get(0));
    assert.isNaN(b1.get(4));
    
    b1.length = 9;
    assert.isEqual(9, b1.length, "Length should change to 9");
    assert.isEqual(0, b1.get(0));
    assert.isEqual(0, b1.get(4));
};

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
};

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
};

exports.testToArray = function() {
    var testArray = [0,1,254,255],
        b1 = new ByteArray(testArray),
        a1 = b1.toArray();
          
    assert.isEqual(testArray.length, a1.length);
    for (var i = 0; i < testArray.length; i++)
        assert.isEqual(testArray[i], a1[i]);
};

exports.testToString = function() {
    // the format of the resulting string isn't specified, but it shouldn't be the decoded string
    // TODO: is this an ok test?
    
    var testString = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
                     "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        testArray = [];
    for (var i = 0; i < 128; i++) testArray.push(65);
    
    var resultString = new ByteArray(testArray).toString();
    
    assert.isTrue(resultString.length < 100);
    assert.isTrue(resultString !== testString);
};

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
};

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
};

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
};

exports.testByteArraySort = function() {
    var testArray = [];
    for (var i = 0; i < 1000; i++)
        testArray.push(Math.floor(Math.random()*256));

    var a = new ByteArray(testArray);
    a.sort();
    
    for (var i = 1; i < a.length; i++)
        assert.isTrue(a.get(i-1) <= a.get(i), "index="+i+"("+a.get(i-1)+","+a.get(i)+")");    
};

exports.testByteArraySortCustom = function() {
    var testArray = [];
    for (var i = 0; i < 1000; i++)
        testArray.push(Math.floor(Math.random()*256));

    var a = new ByteArray(testArray);
    a.sort(function(o1, o2) { return o2-o1; });

    for (var i = 1; i < a.length; i++)
        assert.isTrue(a.get(i-1) >= a.get(i), "index="+i+"("+a.get(i-1)+","+a.get(i)+")");
};

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
};

exports.testByteArrayForEach = function() {
    
    var b = new ByteArray([2, 3, 4, 5]),
        log = [],
        item;
    
    var thisObj = {};
    
    b.forEach(function() {
        log.push({
            thisObj: this,
            args: arguments
        });
    }, thisObj);
    
    assert.isEqual(4, log.length, "block called for each item");

    item = log[0];
    assert.isTrue(thisObj === item.thisObj, "block called with correct thisObj");
    assert.isEqual(3, item.args.length, "block called with three args");
    assert.isEqual(b.get(0), item.args[0], "block called with correct item 0");
    
    item = log[3];
    assert.isEqual(b.get(3), item.args[0], "block called with correct item 3");
    
    
};

exports.testByteArrayConcat = function() {

    var b = new ByteArray();
    
    var b1 = b.concat(new ByteArray([1,2,3]));
    assert.isEqual(3, b1.length);
    assert.isEqual(1, b1.get(0));
    assert.isEqual(2, b1.get(1));
    assert.isEqual(3, b1.get(2));
    
    var b2 = b1.concat(new ByteString([4,5,6]));
    assert.isEqual(6, b2.length);
    assert.isEqual(1, b2.get(0));
    assert.isEqual(3, b2.get(2));
    assert.isEqual(4, b2.get(3));
    assert.isEqual(6, b2.get(5));
    
    var b3 = b2.concat([b, b1, b2, new ByteString(), new ByteArray()]);
    assert.isEqual(b.length + b1.length + b2.length + b2.length, b3.length);
    
};

exports.testByteArrayPush = function() {
    var b1 = new ByteArray();
    assert.isEqual(3, b1.push(1,2,3));
    assert.isEqual(3, b1.length);
    assert.isEqual(1, b1.get(0));
    assert.isEqual(2, b1.get(1));
    assert.isEqual(3, b1.get(2));
    
    var b2 = new ByteArray([7, 8, 9]);
    assert.isEqual(6, b1.push.apply(b1, b2.toArray()));
    assert.isEqual(6, b1.length);
    assert.isEqual(7, b1.get(3));
    assert.isEqual(8, b1.get(4));
    assert.isEqual(9, b1.get(5));
};

exports.testByteArrayUnshift = function() {
    var b1 = new ByteArray([10, 43]);
    assert.isEqual(5, b1.unshift(9, 112, 67));
    assert.isEqual(5, b1.length);
    assert.isEqual(9, b1.get(0));
    assert.isEqual(112, b1.get(1));
    assert.isEqual(67, b1.get(2));
    assert.isEqual(10, b1.get(3));
    assert.isEqual(43, b1.get(4));
    
    var b2 = new ByteArray();
    assert.isEqual(5, b2.unshift.apply(b2, b1.toArray()));
    assert.isEqual(5, b2.length);
    assert.isEqual(9, b2.get(0));
    assert.isEqual(112, b2.get(1));
    assert.isEqual(67, b2.get(2));
    assert.isEqual(10, b2.get(3));
    assert.isEqual(43, b2.get(4));
    assert.isEqual(6, b2.unshift.call(b2, 20));
    assert.isEqual(20, b2.get(0));
};

exports.testByteArraySplice = function() {
    var b1 = new ByteArray([1,2,3,4]);
    var br = b1.splice(2, 0, 5);
    assert.isEqual(0, br.length);
    assert.isEqual(5, b1.length);
    assert.isEqual(1, b1.get(0));
    assert.isEqual(2, b1.get(1));
    assert.isEqual(5, b1.get(2));
    assert.isEqual(3, b1.get(3));
    assert.isEqual(4, b1.get(4));
    
    br = b1.splice(3, 1);
    assert.isEqual(1, br.length);
    assert.isEqual(4, b1.length);
    assert.isEqual(3, br.get(0));
    assert.isEqual(1, b1.get(0));
    assert.isEqual(2, b1.get(1));
    assert.isEqual(5, b1.get(2));
    assert.isEqual(4, b1.get(3));
    
    br = b1.splice(2, 1, 6);
    assert.isEqual(1, br.length);
    assert.isEqual(4, b1.length);
    assert.isEqual(5, br.get(0));
    assert.isEqual(1, b1.get(0));
    assert.isEqual(2, b1.get(1));
    assert.isEqual(6, b1.get(2));
    assert.isEqual(4, b1.get(3));
    
    br = b1.splice(0, 2, 7, 8, 9);
    assert.isEqual(2, br.length);
    assert.isEqual(5, b1.length);
    assert.isEqual(1, br.get(0));
    assert.isEqual(2, br.get(1));
    assert.isEqual(7, b1.get(0));
    assert.isEqual(8, b1.get(1));
    assert.isEqual(9, b1.get(2));
    assert.isEqual(6, b1.get(3));
    assert.isEqual(4, b1.get(4));
    
    br = b1.splice(-3, 1);
    assert.isEqual(1, br.length);
    assert.isEqual(4, b1.length);
    assert.isEqual(9, br.get(0));
    assert.isEqual(7, b1.get(0));
    assert.isEqual(8, b1.get(1));
    assert.isEqual(6, b1.get(2));
    assert.isEqual(4, b1.get(3));
    
    br = b1.splice(-1,0,10,11);
    assert.isEqual(0, br.length);
    assert.isEqual(6, b1.length);
    assert.isEqual(7, b1.get(0));
    assert.isEqual(8, b1.get(1));
    assert.isEqual(6, b1.get(2));
    assert.isEqual(10, b1.get(3));
    assert.isEqual(11, b1.get(4));
    assert.isEqual(4, b1.get(5));
    
    br = b1.splice(-2);
    assert.isEqual(2, br.length);
    assert.isEqual(4, b1.length);
    assert.isEqual(11, br.get(0));
    assert.isEqual(4, br.get(1));
    assert.isEqual(7, b1.get(0));
    assert.isEqual(8, b1.get(1));
    assert.isEqual(6, b1.get(2));
    assert.isEqual(10, b1.get(3));
    
    br = b1.splice(3);
    assert.isEqual(1, br.length);
    assert.isEqual(3, b1.length);
    assert.isEqual(10, br.get(0));
    assert.isEqual(7, b1.get(0));
    assert.isEqual(8, b1.get(1));
    assert.isEqual(6, b1.get(2));
    
    br = b1.splice(-2, 2, 13, 14, 15);
    assert.isEqual(2, br.length);
    assert.isEqual(4, b1.length);
    assert.isEqual(8, br.get(0));
    assert.isEqual(6, br.get(1));
    assert.isEqual(7, b1.get(0));
    assert.isEqual(13, b1.get(1));
    assert.isEqual(14, b1.get(2));
    assert.isEqual(15, b1.get(3));
    
    br = b1.splice();
    assert.isEqual(undefined, br);
    assert.isEqual(4, b1.length);
    assert.isEqual(7, b1.get(0));
    assert.isEqual(13, b1.get(1));
    assert.isEqual(14, b1.get(2));
    assert.isEqual(15, b1.get(3));
    
    br = b1.splice(0);
    assert.isEqual(4, br.length);
    assert.isEqual(0, b1.length);
    assert.isEqual(7, br.get(0));
    assert.isEqual(13, br.get(1));
    assert.isEqual(14, br.get(2));
    assert.isEqual(15, br.get(3));
}

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));
