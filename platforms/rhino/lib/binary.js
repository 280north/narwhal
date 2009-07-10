/* Binary */

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
        
        for (var i = 0; i < this.length; i++) {
            bytes[i] = this.get(i);
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
// decodeToString(number) - returns a String from its decoded bytes in a given base, like 64, 32, 16, 8, 2
Binary.prototype.decodeToString = function(charset) {
    if (charset) {
        if (typeof charset == "number")
            return require("base" + charset).encode(this);
        else if (charset.begins("base"))
            return require(charset).encode(this);
        else
            return String(new java.lang.String(this._bytes, this._offset, this._length, charset));
    }
    return String(new java.lang.String(this._bytes, this._offset, this._length));
};

// get(offset) - Return the byte at offset as a Number.
Binary.prototype.get = function(offset) {
    if (offset < 0 || offset >= this._length)
        return NaN;
    
    var b = this._bytes[this._offset + offset];
    return (b >= 0) ? b : -1 * ((b ^ 0xFF) + 1);
};

// valueOf()
Binary.prototype.valueOf = function() {
    return this;
};

/* ByteString */

var ByteString = exports.ByteString = function() {
    if (!(this instanceof ByteString)) {
        if (arguments.length == 0)
            return new ByteString();
        if (arguments.length == 1)
            return new ByteString(arguments[0]);
        if (arguments.length == 2)
            return new ByteString(arguments[0], arguments[1]);
        if (arguments.length == 3)
            return new ByteString(arguments[0], arguments[1], arguments[2]);
    }

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
            if (b < -0x80 || b > 0xFF)
                throw new Error("ByteString constructor argument Array of integers must be -128 - 255 ("+b+")");
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

ByteString.prototype.charCodeAt = Binary.prototype.get;

ByteString.prototype.byteAt =
ByteString.prototype.charAt = function(offset) {
    var byteValue = this.get(offset);
    
    if (isNaN(byteValue))
        return new ByteString();
        
    return new ByteString([byteValue]);
};

ByteString.prototype.split = function(delimiters, options) {
    var options = options || {},
        count = options.count === undefined ? -1 : options.count,
        includeDelimiter = options.includeDelimiter || false;
    
    // standardize delimiters into an array of ByteStrings:
    if (!Array.isArray(delimiters))
        delimiters = [delimiters];
        
    delimiters = delimiters.map(function(delimiter) {
        if (typeof delimiter === "number")
            delimiter = [delimiter];
        return new ByteString(delimiter);
    });
    
    var components = [],
        startOffset = this._offset,
        currentOffset = this._offset;
    
    // loop until there's no more bytes to consume
    bytes_loop :
    while (currentOffset < this._offset + this._length) {
        
        // try each delimiter until we find a match
        delimiters_loop :
        for (var i = 0; i < delimiters.length; i++) {
            var d = delimiters[i];
            
            for (var j = 0; j < d._length; j++) {
                // reached the end of the bytes, OR bytes not equal
                if (currentOffset + j > this._offset + this._length ||
                    this._bytes[currentOffset + j] !== d._bytes[d._offset + j]) {
                    continue delimiters_loop;
                }
            }
            
            // push the part before the delimiter
            components.push(new ByteString(this._bytes, startOffset, currentOffset - startOffset));
            
            // optionally push the delimiter
            if (includeDelimiter)
                components.push(new ByteString(this._bytes, currentOffset, d._length))
            
            // reset the offsets
            startOffset = currentOffset = currentOffset + d._length;
            
            continue bytes_loop;
        }
        
        // if there was no match, increment currentOffset to try the next one
        currentOffset++;
    }
    
    // push the remaining part, if any
    if (currentOffset > startOffset)
        components.push(new ByteString(this._bytes, startOffset, currentOffset - startOffset));
    
    return components;
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

/* ByteArray */

var ByteArray = exports.ByteArray = function() {
    if (!this instanceof ByteArray) {
        if (arguments.length == 0)
            return new ByteArray();
        if (arguments.length == 1)
            return new ByteArray(arguments[0]);
        if (arguments.length == 2)
            return new ByteArray(arguments[0], arguments[1]);
        if (arguments.length == 3)
            return new ByteArray(arguments[0], arguments[1], arguments[2]);
    }

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
// TODO: I'm assuming Array means an array of ByteStrings/ByteArrays, not an array of integers.
ByteArray.prototype.concat = function() {
    var components = [this],
        totalLength = this.length;
    
    for (var i = 0; i < arguments.length; i++) {
        var component = Array.isArray(component) ? arguments[i] : [component];
        
        for (var j = 0; j < component.length; j++) {
            var subcomponent = component[j];
            if (!(subcomponent instanceof ByteString) && !(subcomponent instanceof ByteArray))
                throw "Arguments to ByteArray.concat() must be ByteStrings, ByteArrays, or Arrays of those.";
            
            components.push(subcomponent);
            totalLength += subcomponent.length;
        }
    }
    
    var result = new ByteArray(totalLength),
        offset = 0;
    
    components.forEach(function(component) {
        java.lang.System.arraycopy(component._bytes, component._offset, result._byte, offset, component._length);
        offset += component._length;
    });
    
    return result;
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
    // "limit" should is halway, rounded down. "top" is the last index.
    var limit = Math.floor(this._length/2) + this._offset,
        top = this._length - 1;
        
    // swap each pair of bytes, up to the halfway point
    for (var i = this._offset; i < limit; i++) {
        var tmp = this._bytes[i];
        this._bytes[i] = this._bytes[top - i];
        this._bytes[top - i] = tmp;
    }
    
    return this;
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

/* BinaryIO */

exports.BinaryIO = function(binary) {
    if (!binary)
        throw "NYI";
    
    var stream = new (require("io").IO)(new java.io.ByteArrayInputStream(binary._bytes, binary._offset, binary._length), null);
    stream.length = binary.length;
    return stream;
};

