// IO: Rhino

var ByteString = require("./binary").ByteString;

var IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
};

IO.prototype.read = function(length) {
    var readAll = false,
        buffer  = null,
        bytes   = null,
        total   = 0,
        index   = 0,
        read    = 0;
    
    if (arguments.length == 0) {
        readAll = true;
    }
    if (typeof length !== "number") {
        length = 1024;
    }

    buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, length);

    do {
        read = this.inputStream.read(buffer, index, length - index);
        
        if (read < 0)
            break;
        
        if (bytes) {
            bytes.write(buffer, index, read);
            index = 0;
        } else {
            index += read;
            if (index === buffer.length && readAll) {
                bytes = new java.io.ByteArrayOutputStream(length * 2);
                bytes.write(buffer, 0, length);
                index = 0;
            }
        }	
        total += read;
        
        
    } while ((readAll || total < length) && read > -1);
    
    var resultBuffer, resultLength;
    
    if (bytes) {
        resultBuffer = bytes.toByteArray();
    } else if (total < buffer.length) {
        resultBuffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, total);
        java.lang.System.arraycopy(buffer, 0, resultBuffer, 0, total);
    } else {
        resultBuffer = buffer;
    }
    
    resultLength = resultBuffer.length;
    
    if (total != resultLength || total !== resultBuffer.length)
        throw new Error("IO.read sanity check failed: total="+total+" resultLength="+resultLength+" resultBuffer.length="+resultBuffer.length);

    return new ByteString(resultBuffer, 0, resultBuffer.length);
};

IO.prototype.copy = function (output, mode, options) {
    while (true) {
        var buffer = this.read(null);
        if (!buffer.length)
            break;
        output.write(buffer);
    }
    output.flush();
    return this;
};

IO.prototype.write = function(object, charset) {
    if (object === null || object === undefined || typeof object.toByteString !== "function")
        throw new Error("Argument to IO.write must have toByteString() method");

    var binary = object.toByteString(charset);
    this.outputStream.write(binary._bytes, binary._offset, binary.length);
    return this;
};

IO.prototype.flush = function() {
    this.outputStream.flush();
    return this;
};

IO.prototype.close = function() {
    if (this.inputStream)
        this.inputStream.close();
    if (this.outputStream)
        this.outputStream.close();
};

IO.prototype.isatty = function () {
    return false;
};

exports.TextInputStream = function (raw, lineBuffering, buffering, charset, options) {
    var stream;

    if (charset === undefined)
        stream = new Packages.java.io.InputStreamReader(raw.inputStream);
    else
        stream = new Packages.java.io.InputStreamReader(raw.inputStream, charset);

    if (buffering === undefined)
        stream = new Packages.java.io.BufferedReader(stream);
    else
        stream = new Packages.java.io.BufferedReader(stream, buffering);

    var self = this;

    self.raw = raw;

    self.readLine = function () {
        var line = stream.readLine();
        if (line === null)
            return '';
        return String(line) + "\n";
    };

    self.itertor = function () {
        return self;
    };

    self.next = function () {
        var line = stream.readLine();
        if (line === null)
            throw StopIteration;
        return String(line);
    };

    self.iterator = function () {
        return self;
    };

    self.forEach = function (block, context) {
        var line;
        while (true) {
            try {
                line = self.next();
            } catch (exception) {
                break;
            }
            block.call(context, line);
        }
    };

    self.input = function () {
        throw "NYI";
    };

    self.readLines = function () {
        var lines = [];
        do {
            var line = self.readLine();
            if (line.length)
                lines.push(line);
        } while (line.length);
        return lines;
    };

    self.read = function () {
        return self.readLines().join('');
    };

    self.readInto = function (buffer) {
        throw "NYI";
    };

    self.copy = function (output, mode, options) {
        do {
            var line = self.readLine();
            output.write(line);
        } while (line.length);
        output.flush();
        return self;
    };

    self.close = function () {
        stream.close();
    };

};

exports.TextOutputStream = function (raw, lineBuffering, buffering, charset, options) {
    var stream;

    if (charset === undefined)
        stream = new Packages.java.io.OutputStreamWriter(raw.outputStream);
    else
        stream = new Packages.java.io.OutputStreamWriter(raw.outputStream, charset);

    if (buffering === undefined)
        stream = new Packages.java.io.BufferedWriter(stream);
    else
        stream = new Packages.java.io.BufferedWriter(stream, buffering);

    var self = this;

    self.raw = raw;

    self.write = function () {
        stream.write.apply(stream, arguments);
        return self;
    };

    self.writeLine = function (line) {
        self.write(line + "\n"); // todo recordSeparator
        return self;
    };

    self.writeLines = function (lines) {
        lines.forEach(self.writeLine);
        return self;
    };

    self.print = function () {
        self.write(Array.prototype.join.call(arguments, " ") + "\n");
        self.flush();
        // todo recordSeparator, fieldSeparator
        return self;
    };

    self.flush = function () {
        stream.flush();
        return self;
    };

    self.close = function () {
        stream.close();
        return self;
    };

};

exports.TextIOWrapper = function (raw, mode, lineBuffering, buffering, charset, options) {
    if (mode.update) {
        return new exports.TextIOStream(raw, lineBuffering, buffering, charset, options);
    } else if (mode.write || mode.append) {
        return new exports.TextOutputStream(raw, lineBuffering, buffering, charset, options);
    } else if (mode.read) {
        return new exports.TextInputStream(raw, lineBuffering, buffering, charset, options);
    } else {
        throw new Error("file must be opened for read, write, or append mode.");
    }
}; 

var ByteIO = exports.ByteIO = function (initial) {
};

var StringIO = exports.StringIO = function (initial) {
    var buffer = new java.lang.StringBuffer();
    if (initial)
        buffer.append(initial);

    function length() {
        return buffer.length();
    }

    function read(length) {
        if (arguments.length == 0) { 
            var result = String(buffer);
            buffer['delete'](0, buffer.length());
            return result;
        } else {
            if (!length || length < 1)
                length = 1024;
            length = Math.min(buffer.length(), length);
            var result = String(buffer.substring(0, length));
            buffer['delete'](0, length);
            return result;
        }
    }

    function write(text) {
        buffer.append(text);
        return self;
    }

    function copy(output) {
        output.write(read()).flush();
        return self;
    }

    function next() {
        if (buffer.length() == 0)
            throw StopIteration;
        var pos = buffer.indexOf("\n");
        if (pos == -1)
            pos = buffer.length();
        var result = read(pos);
        read(1);
        return result;
    }

    var self = {
        get length() {
            return length();
        },
        read: read,
        write: write,
        copy: copy,
        close: function () {
            return self;
        },
        flush: function () {
            return self;
        },
        iterator: function () {
            return self;
        },
        forEach: function (block) {
            while (true) {
                try {
                    block.call(this, next());
                } catch (exception) {
                    if (exception instanceof StopIteration)
                        break;
                    throw exception;
                }
            }
        },
        readLine: function () {
            var pos = buffer.indexOf("\n");
            if (pos == -1)
                pos = buffer.length();
            return read(pos + 1);
        },
        next: next,
        print: function (line) {
            return write(line + "\n").flush();
        },
        toString: function() {
            return String(buffer);
        },
        substring: function () {
            var string = String(buffer);
            return string.substring.apply(string, arguments);
        },
        slice: function () {
            var string = String(buffer);
            return string.slice.apply(string, arguments);
        },
        substr: function () {
            var string = String(buffer);
            return string.substr.apply(string, arguments);
        }
    };
    return self;
};

