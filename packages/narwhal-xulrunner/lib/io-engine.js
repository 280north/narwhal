const Cc = Components.classes;
const Ci = Components.interfaces;

var IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
};

IO.prototype.read = function(length) {
    return this.inputStream(length);
};

IO.prototype.write = function(object) {
    this.outputStream(object);
};

IO.prototype.flush = function() {
};

IO.prototype.close = function() {
};

IO.prototype.isatty = function () {
    return false;
};



exports.TextInputStream = function (raw, lineBuffering, buffering, charset, options) {
    var stream;

//    if (charset === undefined) {
//    if (buffering === undefined)

    stream = raw.inputStream;
    stream.QueryInterface(Ci.nsILineInputStream);

    var self = this;

    self.readLine = function () {
//        var line = stream.readLine();
//        if (line === null)
//            return '';
//        return String(line) + "\n";
    };

    self.iter = function () {
        return self;
    };

    self.next = function () {
//        var line = stream.readLine();
//        if (line === null)
//            throw new Error("StopIteration");
//        return line;
    };

    self.input = function () {
        throw "NYI";
    };

    self.readLines = function () {
        var line = {},
            lines = [],
            hasmore;
        do {
          hasmore = stream.readLine(line);
          lines.push(line.value);
        } while(hasmore);
        return lines;
    };

    self.read = function () {
        return self.readLines().join("\n");
    };

    self.readInto = function (buffer) {
        throw "NYI";
    };

    self.close = function () {
        stream.close();
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



var StringIO = exports.StringIO = function (initial) {
    var buffer = [];
    if (initial) {
        buffer = buffer.concat(initial.join(""));
    }

    function length() {
        return buffer.length;
    }

    function read(length) {
        var result;

        if (arguments.length == 0) { 
            result = buffer.join("");
            buffer = [];
            return result;
        } else {
            if (!length || length < 1)
                length = 1024;
            length = Math.min(buffer.length, length);
            result = buffer.slice(0, length).join("");
            buffer = [];
            return result;
        }
    }

    function write(text) {
        buffer = buffer.concat(text.split(""));
        return self;
    }

    function copy(output) {
        output.write(read()).flush();
        return self;
    }

    function next() {
        var pos, result;
        if (buffer.length === 0) { throw StopIteration; }
        pos = buffer.indexOf("\n");
        if (pos === -1) { pos = buffer.length; }
        result = read(pos);
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
            if (pos === -1) { pos = buffer.length; }
            return read(pos + 1);
        },
        next: next,
        print: function (line) {
            return write(line + "\n").flush();
        },
        toString: function() {
            return buffer.join("");
        },
        substring: function () {
            var string = buffer.join("");
            return string.substring.apply(string, arguments);
        },
        slice: function () {
            var string = buffer.join("");
            return string.slice.apply(string, arguments);
        },
        substr: function () {
            var string = buffer.join("");
            return string.substr.apply(string, arguments);
        }
    };
    return self;
};

