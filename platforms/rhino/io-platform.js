// IO: Rhino

var Binary = require("./binary").Binary;

var IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
};

IO.prototype.read = function(length, encoding) {
    var readAll = true,
        buffer  = null,
        bytes   = null,
        read    = 0,
        index   = 0,
        total   = 0;

    if (typeof length === "number") {
        readAll = false;
        buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, length);
    } else {
        bytes = new java.io.ByteArrayOutputStream();
        buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
    }

    do {
        read = this.inputStream.read(buffer, index, buffer.length - index);

        if (read < 0)
            break;

        if (readAll) {
            bytes.write(buffer, index, read);
            if (index >= buffer.length)
                index = 0;
        }
        index += read;
        total += read;

        //print("read="+read+" index="+index+" total="+total+" length="+length+" buffers.length="+buffers.length);

    } while ((readAll || total < length) && read > 0);

    var resultBuffer, resultLength;

    if (readAll)
        resultBuffer = bytes.toByteArray();
    else
        resultBuffer = buffer;

    resultLength = resultBuffer.length;

    if (total != resultLength || total !== resultBuffer.length)
        throw new Error("IO.read sanity check failed: total="+total+" resultLength="+resultLength+" resultBuffer.length="+resultBuffer.length);

    return new Binary(resultBuffer);
};

IO.prototype.write = function(object, encoding) {
    if (object === null || object === undefined || typeof object.toBinary !== "function")
        throw new Error("Argument to IO.write must have toBinary() method");

    var binary = object.toBinary(encoding);
    this.outputStream.write(binary.bytes);
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

exports.TextIOWrapper = function (buffer, encoding, options) {
    throw new Error("TextIOWrapper not implemented.");
    var errors = options.errors;
    var recordSeparator = options.recordSeparator;
    var fieldSeparator = options.fieldSeparator;
    var lineBuffering = options.lineBuffering;
};

exports.TextInputStream = function (raw, lineBuffering, buffering, encoding, options) {
    print('encoding ' + encoding);
    var stream = new Packages.java.io.InputStreamReader(raw.inputStream, encoding);
    if (buffering === undefined)
        stream = new Packages.java.io.BufferedReader(stream);
    else
        stream = new Packages.java.io.BufferedReader(stream, buffering);
    var self = this;

    self.readLine = function () {
        var line = stream.readLine();
        if (line === null)
            return '';
        return String(line) + "\n";
    };

    self.iter = function () {
        return self;
    };

    self.next = function () {
        var line = stream.readLine();
        if (line === null)
            throw new Error("StopIteration");
        return line;
    };

    self.readLines = function () {
        var lines = [];
        try {
            while (true) {
                lines.push(self.next());
            }
        } catch (exception) {
        }
        return lines;
    };

    self.read = function () {
        return self.readLines().join('');
    };

    self.close = function () {
        stream.close();
    };

};

exports.TextIOWrapper = function (raw, mode, lineBuffering, buffering, encoding, options) {
    if (mode.update) {
        return new exports.TextIOStream(raw, lineBuffering, buffering, encoding, options);
    } else if (mode.write || mode.append) {
        return new exports.TextOutputStream(raw, lineBuffering, buffering, encoding, options);
    } else if (mode.read) {
        return new exports.TextInputStream(raw, lineBuffering, buffering, encoding, options);
    } else {
        throw new Error("file must be opened for read, write, or append mode.");
    }
}; 

