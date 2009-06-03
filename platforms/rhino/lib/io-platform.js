// IO: Rhino

var ByteString = require("./binary").ByteString;

var IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
};

IO.prototype.read = function(length) {
    var readAll = false,
        buffers = [],
        buffer  = null,
        total   = 0,
        index   = 0,
        read    = 0;
    
    if (arguments.length == 0) {
        readAll = true;
    }
    if (typeof length !== "number") {
        length = 1024;
    }

    do {
        if (!buffer)
            buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, length);
            
        read = this.inputStream.read(buffer, index, buffer.length - index);
        
        if (read < 0)
            break;
        
        index += read;
        total += read;
        
        if (index >= buffer.length) {
            buffers.push(buffer);
            buffer = null;
            index = 0;
            length *= 2;
        }
        
    } while (readAll && read > 0);
    
    var resultBuffer, resultLength;
    
    if (buffers.length === 1 && index === 0) {
        resultBuffer = buffers[0]
        resultLength = resultBuffer.length;
    }
    else {
        resultBuffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, total),
        resultLength = 0;
            
        for (var i = 0; i < buffers.length; i++) {
            var buf = buffers[i];
            java.lang.System.arraycopy(buf, 0, resultBuffer, resultLength, buf.length);
            resultLength += buf.length;
        }
        
        if (index > 0) {
            java.lang.System.arraycopy(buffer, 0, resultBuffer, resultLength, index);
            resultLength += index;
        }
    }
    
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

    self.copy = function (output, mode, options) {
        do {
            var line = self.readLine();
            output.write(line);
        } while (line.length);
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

