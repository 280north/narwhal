var ByteArray = require("bytearray").ByteArray;

var ByteString = exports.ByteString = function() {
    if (arguments.length === 0) {
        this._bytes = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 0); // null;
        this._offset = 0;
        this.length = 0;
    }
    else if (arguments.length === 1) {
        if (arguments[0] instanceof ByteString) {
            return arguments[0];
        }
        else if (arguments[0] instanceof ByteArray) {
            throw "NYI";
        }
        else if (arguments[0] instanceof String) {
            throw "NYI";
        }
        else if (Array.isArray(arguments[0])) {
            var bytes = arguments[0];
            this._bytes = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, bytes.length);
            for (var i = 0; i < bytes.length; i++) {
                var b = bytes[i];
                if (b < 0 || b > 0xFF)
                    throw new Error("ByteString constructor argument Array of integers must be 0 - 255");
                // Java "bytes" are interpreted as 2's complement
                this._bytes[i] = (b < 128) ? b : -1 * ((b ^ 0xFF) + 1);
            }
            this._offset = 0;
            this.length = this._bytes.length;
        }
        else
            throw new Error(
                "Illegal arguments to ByteString constructor: " +
                arguments[0]
            );
    }
    else if (arguments.length === 2) {
        if (
            typeof arguments[0] !== "string" || (
                typeof arguments[1] !== "string" &&
                typeof arguments[1] !== "undefined"
            )
        )
            throw new Error(
                "Illegal arguments to ByteString constructor: " +
                arguments[0] + ' ' + arguments[1]
            );

        var string = new java.lang.String(arguments[0]);
        this._bytes = arguments[1] ?
            string.getBytes(arguments[1]) :
            string.getBytes()
        this._offset = 0;
        this.length = this._bytes.length;
    }
    // private:
    else if (arguments.length === 3 && Array.isArray(arguments[0]) && typeof arguments[1] === "number" && typeof arguments[2] === "number") {
        this._bytes = arguments[0];    
        this._offset = arguments[1];
        this.length = arguments[2];
    }
    else
        throw new Error(
            "Illegal arguments to ByteString constructor: " +
            arguments[0] + ' ' + arguments[1] + ' ' + arguments[2]
        );

    seal(this);
};

ByteString.prototype.toByteArray = function(sourceCharset, targetCharset) {
    throw "NYI";
    
    if (arguments.length === 0) {
    }
    else if (arguments.length === 2 && typeof sourceCharset === "string" && typeof targetCharset === "string") {
    }
    
    throw new Error("Illegal arguments to ByteString toByteArray");
};

ByteString.prototype.toByteString = function(sourceCharset, targetCharset) {
    if (arguments.length < 2) {
        // toByteString() is obvious
        // toByteString(charset) is not as obvious, but 
        // it is necessary to pass this form through too
        // so that you can coerce either a String or ByteString
        // to a ByteString with the same expression, simply
        // assuming that the charset is proper if it's a
        // ByteString.  This behavior is dubious and may be
        // redacted.
        return this;
    } else if (arguments.length === 2 && typeof sourceCharset === "string" && typeof targetCharset === "string") {
        var bytes = new java.lang.String(this._bytes, this._offset, this.length, sourceCharset).getBytes(targetCharset);
        return new ByteString(bytes, 0, bytes.length);
    } 
    
    throw new Error("Illegal arguments to ByteString toByteString " + arguments.length + ' ' + arguments[0]);
};

ByteString.prototype.toArray = function(charset) {
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
        var string = new java.lang.String(this._bytes, this._offset, this.length, charset),
            length = string.length(),
            array = new Array(length);
        
        for (var i = 0; i < length; i++)
            array[i] = string.codePointAt(i);
        
        return array;
    }
    else
        throw new Error("Illegal arguments to ByteString toArray()");
};

ByteString.prototype.toString = function(charset) {
    if (charset)
        return this.decodeToString(charset);
    return "[ByteString "+this.length+"]";
}

ByteString.prototype.decodeToString = function(charset) {
    return String(new java.lang.String(this._bytes, this._offset, this.length, charset));
};

ByteString.prototype.indexOf = function(byteValue, start, stop) {
    var array = this.toArray();
    return array.indexOf.apply(array, arguments);
};

ByteString.prototype.lastIndexOf = function(byteValue, start, stop) {
    var array = this.toArray();
    return array.lastIndexOf.apply(array, arguments);
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
    return Array.prototype.map.call(this, function (c) {
        return c.charCodeAt();
    });
};

String.fromCharCodes = function (codes) {
    return codes.map(String.fromCharCode).join('');
};

/* Array */

Array.prototype.toByteString = function(charset) {
    return new ByteString(this);
};

