/* Binary 

var Binary = exports.Binary = function() {
    // this._bytes
    // this._offset
    // this._length
}

Binary.prototype.__defineGetter__("length", function() { return this._length; });
Binary.prototype.__defineSetter__("length", function(length) { print("x trying to set length: " + length); });

// toArray() - n array of the byte values
// toArray(charset) - an array of the code points, decoded
Binary.prototype.toArray = function(codec) {
    if (arguments.length === 0) {
        var bytes = new Array(this._length);
        
        for (var i = 0; i < this._length; i++) {
            var b = this._bytes[i + this._offset];
            // Java "bytes" are interpreted as 2's complement
            bytes[i] = (b >= 0) ? b : -1 * ((b ^ 0xFF) + 1);
        }
        
        return bytes;
    }
    else if (arguments.length === 1) {
        var string = new java.lang.String(this._bytes, this._offset, this._length, codec),
            length = string.length(),
            array = new Array(length);
        
        for (var i = 0; i < length; i++)
            array[i] = string.codePointAt(i);
        
        return array;
    }
    else
        throw new Error("Illegal arguments to toArray()");
};

// toByteArray() - just a copy
// toByteArray(sourceCharset, targetCharset) - transcoded
Binary.prototype.toByteArray = function(sourceCodec, targetCodec) {
    if (arguments.length < 2)
        return new ByteArray(this);
    else if (arguments.length === 2 && typeof sourceCodec === "string" && typeof targetCodec === "string") {
        var bytes = new java.lang.String(this._bytes, this._offset, this._length, sourceCodec).getBytes(targetCodec);
        return new ByteArray(bytes, 0, bytes.length);
    }
    
    throw new Error("Illegal arguments to ByteArray toByteArray");
};

// toByteString() - byte for byte copy
// toByteString(sourceCharset, targetCharset) - transcoded
Binary.prototype.toByteString = function(sourceCodec, targetCodec) {
    if (arguments.length < 2)
        return new ByteString(this);
    else if (arguments.length === 2 && typeof sourceCodec === "string" && typeof targetCodec === "string") {
        var bytes = new java.lang.String(this._bytes, this._offset, this._length, sourceCodec).getBytes(targetCodec);
        return new ByteString(bytes, 0, bytes.length);
    }
    
    throw new Error("Illegal arguments to ByteArray toByteString");
};

// decodeToString()
// decodeToString(charset) - returns a String from its decoded bytes in a given charset. If no charset is provided, or if the charset is "undefined", assumes the default system encoding.
Binary.prototype.decodeToString = function(charset) {
    if (charset)
        return String(new java.lang.String(this._bytes, this._offset, this._length, charset));
    
    return String(new java.lang.String(this._bytes, this._offset, this._length));
};

// byteAt(offset) - Return the byte at offset as a Number.
Binary.prototype.byteAt = function(offset) {
    if (offset < 0 || offset >= this._length)
        return NaN;
        
    return this._bytes[this._offset + offset];
};

// valueOf()
Binary.prototype.valueOf = function() {
    return this;
};

// ByteString

var ByteString = exports.ByteString = function() {
    // ByteString() - Construct an empty byte string.
    if (arguments.length === 0) {
        this._bytes     = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 0); // null;
        this._offset    = 0;
        this._length    = 0;
    }
    // ByteString(byteString) - Copies byteString.
    else if (arguments.length === 1 && arguments[0] instanceof ByteString) {
        return arguments[0];
    }
    // ByteString(byteArray) - Use the contents of byteArray.
    else if (arguments.length === 1 && arguments[0] instanceof ByteArray) {
        var copy = arguments[0].toByteArray();
        this._bytes     = copy._bytes;
        this._offset    = copy._offset;
        this._length    = copy._length;
    }
    // ByteString(arrayOfNumbers) - Use the numbers in arrayOfNumbers as the bytes.
    else if (arguments.length === 1 && Array.isArray(arguments[0])) {
        var bytes = arguments[0];
        this._bytes = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, bytes.length);
        for (var i = 0; i < bytes.length; i++) {
            var b = bytes[i];
            // If any element is outside the range 0...255, an exception (TODO) is thrown.
            if (b < 0 || b > 0xFF)
                throw new Error("ByteString constructor argument Array of integers must be 0 - 255 ("+b+")");
            // Java "bytes" are interpreted as 2's complement
            this._bytes[i] = (b < 128) ? b : -1 * ((b ^ 0xFF) + 1);
        }
        this._offset = 0;
        this._length = this._bytes.length;
    }
    // ByteString(string, charset) - Convert a string. The ByteString will contain string encoded with charset.
    else if ((arguments.length === 1 || (arguments.length === 2 && arguments[1] === undefined)) && typeof arguments[0] === "string") {
        this._bytes     = new java.lang.String(arguments[0]).getBytes();
        this._offset    = 0;
        this._length    = this._bytes.length;
    }
    else if (arguments.length === 2 && typeof arguments[0] === "string" && typeof arguments[1] === "string") {
        this._bytes     = new java.lang.String(arguments[0]).getBytes(arguments[1]);
        this._offset    = 0;
        this._length    = this._bytes.length;
    }
    // private: ByteString(bytes, offset, length)
    else if (arguments.length === 3 && Array.isArray(arguments[0]) && typeof arguments[1] === "number" && typeof arguments[2] === "number") {
        this._bytes     = arguments[0];
        this._offset    = arguments[1];
        this._length    = arguments[2];
    }
    else
        throw new Error("Illegal arguments to ByteString constructor: [" +
            Array.prototype.join.apply(arguments, [","]) + "] ("+arguments.length+")");
    
    //seal(this);
};

ByteString.prototype = new Binary();

ByteString.prototype.__defineGetter__("length", function() { return this._length; });
ByteString.prototype.__defineSetter__("length", function(length) {});

ByteString.prototype.toString = function(charset) {
    if (charset)
        return this.decodeToString(charset);
        
    return "[ByteString "+this.length+"]";
}

ByteString.prototype.indexOf = function(byteValue, start, stop) {
    var array = this.slice(start, stop).toArray(),
        result = array.indexOf(byteValue);
    return (result < 0) ? -1 : result + (start || 0);
};

ByteString.prototype.lastIndexOf = function(byteValue, start, stop) {
    var array = this.slice(start, stop).toArray(),
        result = array.lastIndexOf(byteValue);
    return (result < 0) ? -1 : result + (start || 0);
};

ByteString.prototype.charCodeAt = Binary.prototype.byteAt;

ByteString.prototype.charAt = function(offset) {
    var byteValue = this.charCodeAt(offset);
    
    if (isNaN(byteValue))
        return new ByteString();
        
    return new ByteString([byteValue]);
};

ByteString.prototype.split = function(delimiter, options) {
    throw "NYI";
};

ByteString.prototype.slice = function(begin, end) {
    if (begin === undefined)
        begin = 0;
    else if (begin < 0)
        begin = this._length + begin;
        
    if (end === undefined)
        end = this._length;
    else if (end < 0)
        end = this._length + end;
    
    begin = Math.min(this._length, Math.max(0, begin));
    end = Math.min(this._length, Math.max(0, end));
    
    return new ByteString(this._bytes, this._offset + begin, end - begin);
};

ByteString.prototype.substr = function(start, length) {
    if (start !== undefined) {
        if (length !== undefined)
            return this.slice(start);
        else
            return this.slice(start, start + length);
    }
    return this.slice();
};

ByteString.prototype.substring = function(from, to) {
    if (from !== undefined) {
        if (to !== undefined)
            return this.slice(Math.max(Math.min(begin, this._length), 0));
        else
            return this.slice(Math.max(Math.min(begin, this._length), 0),
                              Math.max(Math.min(end, this._length), 0));
    }
    return this.slice();
};

ByteString.prototype.toSource = function() {
    return "ByteString(["+this.toArray().join(",")+"])";
}

// ByteArray

var ByteArray = exports.ByteArray = function() {
    // ByteArray() - New, empty ByteArray.
    if (arguments.length === 0) {
        this._bytes     = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 0); // null;
        this._offset    = 0;
        this._length    = 0;
    }
    // ByteArray(length) - New ByteArray filled with length zero bytes.
    else if (arguments.length === 1 && typeof arguments[0] === "number") {
        this._bytes     = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, arguments[0]); // null;
        this._offset    = 0;
        this._length    = this._bytes.length;
    }
    // ByteArray(byteArray) - Copy byteArray.
    // ByteArray(byteString) - Copy contents of byteString.
    else if (arguments.length === 1 && (arguments[0] instanceof ByteArray || arguments[0] instanceof ByteString)) {
        var byteArray = new ByteArray(arguments[0]._length);
        java.lang.System.arraycopy(arguments[0]._bytes, arguments[0]._offset, byteArray._bytes, byteArray._offset, byteArray._length);
        return byteArray;
    }
    // ByteArray(arrayOfBytes) - Use numbers in arrayOfBytes as contents.
    // Throws an exception if any element is outside the range 0...255 (TODO).
    else if (arguments.length === 1 && Array.isArray(arguments[0])) {
        var bytes = arguments[0];
        this._bytes = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, bytes.length);
        for (var i = 0; i < bytes.length; i++) {
            var b = bytes[i];
            // If any element is outside the range 0...255, an exception (TODO) is thrown.
            if (b < 0 || b > 0xFF)
                throw new Error("ByteString constructor argument Array of integers must be 0 - 255 ("+b+")");
            // Java "bytes" are interpreted as 2's complement
            this._bytes[i] = (b < 128) ? b : -1 * ((b ^ 0xFF) + 1);
        }
        this._offset = 0;
        this._length = this._bytes.length;
    }
    // ByteArray(string, charset) - Create a ByteArray from a Javascript string, the result being encoded with charset.
    else if ((arguments.length === 1 || (arguments.length === 2 && arguments[1] === undefined)) && typeof arguments[0] === "string") {
        this._bytes     = new java.lang.String(arguments[0]).getBytes();
        this._offset    = 0;
        this._length    = this._bytes.length;
    }
    else if (arguments.length === 2 && typeof arguments[0] === "string" && typeof arguments[1] === "string") {
        this._bytes     = new java.lang.String(arguments[0]).getBytes(arguments[1]);
        this._offset    = 0;
        this._length    = this._bytes.length;
    }
    // private: ByteArray(bytes, offset, length)
    else if (arguments.length === 3 && Array.isArray(arguments[0]) && typeof arguments[1] === "number" && typeof arguments[2] === "number") {
        this._bytes     = arguments[0];
        this._offset    = arguments[1];
        this._length    = arguments[2];
    }
    else
        throw new Error("Illegal arguments to ByteString constructor: [" +
            Array.prototype.join.apply(arguments, [","]) + "] ("+arguments.length+")");
}

ByteArray.prototype = new Binary();

ByteArray.prototype.__defineGetter__("length", function() { return this._length; });
ByteArray.prototype.__defineSetter__("length", function(length) {
    if (typeof length !== "number")
        return;
    
    // same length
    if (length === this.length) {
        return;
    }
    // new length is less, truncate
    else if (length < this._length) {
        this._length = length;
    }
    // new length is more, but fits without moving, just clear new bytes
    else if (this._offset + length <= this._bytes.length) {
        java.util.Arrays.fill(this._bytes, this._length, this._offset + length - 1, 0);
        this._length = length;
    }
    // new length is more, but fits if we shift to bottom, so do that.
    else if (length <= this._bytes.length) {
        java.lang.System.arraycopy(this._bytes, this._offset, this._bytes, 0, this._length);
        this._offset = 0;
        java.util.Arrays.fill(this._bytes, this._length, this._offset + length - 1, 0);
        this._length = length;
    }
    // new length is more than the allocated bytes array, allocate a new one and copy the data
    else {
        var newBytes = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, length);
        java.lang.System.arraycopy(this._bytes, this._offset, newBytes, 0, this._length);
        this._bytes = newBytes;
        this._offset = 0;
        this._length = length;
    }
});

// toString() - a string representation like "[ByteArray 10]"
// toString(charset) - an alias for decodeToString(charset)
ByteArray.prototype.toString = function(charset) {
    if (charset)
        return this.decodeToString(charset);
    
    return "[ByteArray "+this.length+"]"; 
}

// concat(other ByteArray|ByteString|Array)
ByteArray.prototype.concat = function() {
    throw "NYI";
}

// pop() -> byte Number
ByteArray.prototype.pop = function() {
    if (this._length === 0)
        return undefined;
    
    this._length--;
    
    return this._bytes[this._offset + this._length];
}

// push(...variadic Numbers...)-> count Number
ByteArray.prototype.push = function() {
    throw "NYI";
}

// shift() -> byte Number
ByteArray.prototype.shift = function() {
    if (this._length === 0)
        return undefined;
    
    this._length--;
    this._offset++;
    
    return this._bytes[this._offset - 1];
}

// unshift(...variadic Numbers...) -> count Number
ByteArray.prototype.unshift = function() {
    throw "NYI";
}

// reverse() in place reversal
ByteArray.prototype.reverse = function() {
    throw "NYI";
}

// slice()
ByteArray.prototype.slice = function() {
    return new ByteArray(ByteString.prototype.apply.slice(this, arguments));
}

// sort()
ByteArray.prototype.sort = function() {
    // FIXME: inefficient
    var array = this.toArray()
    return new ByteArray(array.sort.apply(array, arguments));
}

// splice()
ByteArray.prototype.splice = function() {
    throw "NYI";
}

// toSource() returns a string like "ByteArray([])" for a null byte-array.
ByteArray.prototype.toSource = function() {
    return "ByteArray(["+this.toArray().join(",")+"])";
}

// String 

String.prototype.toByteString = function(charset) {
    // RHINO bug: it thinks "this" is a Java string (?!)
    return new ByteString(String(this), charset);
};

String.prototype.toByteArray = function(charset) {
    // RHINO bug: it thinks "this" is a Java string (?!)
    return new ByteArray(String(this), charset);
};

String.prototype.charCodes = function() {
    return Array.prototype.map.call(this, function (c) {
        return c.charCodeAt();
    });
};

String.fromCharCodes = function (codes) {
    return codes.map(String.fromCharCode).join('');
};

// Array //

Array.prototype.toByteString = function(charset) {
    return new ByteString(this);
};

Array.prototype.toByteArray = function(charset) {
    return new ByteArray(this);
};

// BinaryIO //

exports.BinaryIO = function(binary) {
    if (!binary)
        throw "NYI";
    
    var stream = new (require("io").IO)(new java.io.ByteArrayInputStream(binary._bytes, binary._offset, binary._length), null);
    stream.length = binary.length;
    return stream;
}
*/
