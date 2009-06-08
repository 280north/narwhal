const Cc = Components.classes;
const Ci = Components.interfaces;

var IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
}

IO.prototype.read = function(length) {
    return this.inputStream(length);
}

IO.prototype.write = function(object) {
    this.outputStream(object);
}

IO.prototype.flush = function() {
}

IO.prototype.close = function() {
}

IO.prototype.isatty = function () {
    return false;
}



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
