var ByteArray = require("bytearray").ByteArray;

var ByteString = exports.ByteString = function() {
    // ByteString() - Construct an empty byte string.
    if (arguments.length === 0) {
        this._bytes     = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 0); // null;
        this._offset    = 0;
        this.length     = 0;
    }
    // ByteString(byteString) - Copies byteString.
    else if (arguments.length === 1 && arguments[0] instanceof ByteString) {
        return arguments[0];
    }
    // ByteString(byteArray) - Use the contents of byteArray.
    else if (arguments.length === 1 && arguments[0] instanceof ByteArray) {
        return arguments[0].toByteString();
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
        this.length = this._bytes.length;
    }
    // ByteString(string, charset) - Convert a string. The ByteString will contain string encoded with charset.
    else if ((arguments.length === 1 || (arguments.length === 2 && arguments[1] === undefined)) && typeof arguments[0] === "string") {
        this._bytes     = new java.lang.String(arguments[0]).getBytes();
        this._offset    = 0;
        this.length     = this._bytes.length;
    }
    else if (arguments.length === 2 && typeof arguments[0] === "string" && typeof arguments[1] === "string") {
        this._bytes     = new java.lang.String(arguments[0]).getBytes(arguments[1]);
        this._offset    = 0;
        this.length     = this._bytes.length;
    }
    // private: ByteString(bytes, offset, length)
    else if (arguments.length === 3 && Array.isArray(arguments[0]) && typeof arguments[1] === "number" && typeof arguments[2] === "number") {
        this._bytes     = arguments[0];
        this._offset    = arguments[1];
        this.length     = arguments[2];
    }
    else
        throw new Error("Illegal arguments to ByteString constructor: [" +
            Array.prototype.join.apply(arguments, [","]) + "] ("+arguments.length+")");
    
    // FIXME: Setting .length shouldn't throw an exception
    seal(this);
};

ByteString.prototype.toByteArray = function(sourceCodec, targetCodec) {
    throw "NYI";
    
    if (arguments.length === 0) {
    }
    else if (arguments.length === 2 && typeof sourceCodec === "string" && typeof targetCodec === "string") {
    }
    
    throw new Error("Illegal arguments to ByteString toByteArray");
};

ByteString.prototype.toByteString = function(sourceCodec, targetCodec) {
    if (arguments.length < 2) {
        return this;
    }
    else if (arguments.length === 2 && typeof sourceCodec === "string" && typeof targetCodec === "string") {
        var bytes = new java.lang.String(this._bytes, this._offset, this.length, sourceCodec).getBytes(targetCodec);
        return new ByteString(bytes, 0, bytes.length);
    } 
    
    throw new Error("Illegal arguments to ByteString toByteString");
};

ByteString.prototype.toArray = function(codec) {
    if (arguments.length === 0) {
        var bytes = new Array(this.length);
        
        for (var i = 0; i < this.length; i++) {
            var b = this._bytes[i + this._offset];
            // Java "bytes" are interpreted as 2's complement
            bytes[i] = (b >= 0) ? b : -1 * ((b ^ 0xFF) + 1);
        }
        
        return bytes;
    }
    else if (arguments.length === 1) {
        var string = new java.lang.String(this._bytes, this._offset, this.length, codec),
            length = string.length(),
            array = new Array(length);
        
        for (var i = 0; i < length; i++)
            array[i] = string.codePointAt(i);
        
        return array;
    }
    else
        throw new Error("Illegal arguments to ByteString toArray()");
};

ByteString.prototype.toString = function() {
    return "[ByteString "+this.length+"]";
}

ByteString.prototype.decodeToString = function(codec) {
    return String(new java.lang.String(this._bytes, this._offset, this.length, codec));
};

ByteString.prototype.indexOf = function(byteValue, start, stop) {
    throw "NYI";
};

ByteString.prototype.lastIndexOf = function(byteValue, start, stop) {
    throw "NYI";
};

ByteString.prototype.byteAt = ByteString.prototype.charCodeAt = function(offset) {
    if (offset < 0 || offset >= this.length)
        return NaN;
        
    return this._bytes[this._offset + offset];
};

ByteString.prototype.charAt = function(offset) {
    var byteValue = this.byteAt(offset);
    
    if (isNaN(byteValue))
        return new ByteString();
        
    return new ByteString([byteValue]);
};

ByteString.prototype.split = function(delimiter, options) {
    throw "NYI";
};

ByteString.prototype.slice = function(begin, end) {
    if (begin < 0)
        begin = this.length + begin;
        
    if (end === undefined)
        end = this.length;
    else if (end < 0)
        end = this.length + end;
    
    begin = Math.min(this.length, Math.max(0, begin));
    end = Math.min(this.length, Math.max(0, end));
    
    return new ByteString(this._bytes, this._offset + begin, end - begin);
};

/* String */

String.prototype.toByteString = function(charset) {
    // RHINO bug: it thinks "this" is a Java string (?!)
    return new ByteString(String(this), charset);
};

String.prototype.charCodes = function() {
    throw "NYI";
};

/* Array */

Array.prototype.toByteString = function(charset) {
    return new ByteString(this);
};

