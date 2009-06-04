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
    
    if (typeof length !== "number") {
        readAll = true;
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
    // TODO buffered copy of an input stream to an output stream
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
            throw new StopIteration();
        return String(line);
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

