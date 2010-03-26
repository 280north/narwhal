
// -- tlrobinson Tom Robinson

// IO: engine independent

var engine = require("io-engine");

var ByteString = require("binary").ByteString,
    ByteArray = require("binary").ByteArray,
    B_COPY = require("binary-engine").B_COPY;

for (var name in engine) {
    if (Object.prototype.hasOwnProperty.call(engine, name)) {
        exports[name] = engine[name];
    }
};

var IO = exports.IO;

IO.prototype.readChunk = IO.prototype.readChunk || function(length) {
    if (typeof length !== "number") length = 1024;

    var buffer = new ByteArray(length);
    
    var readLength = this.readInto(buffer, length, 0);

    if (readLength <= 0)
        return new ByteString();

    return new ByteString(buffer._bytes, 0, readLength);
};

IO.prototype.read = IO.prototype.read || function(length) {
    if (length !== undefined)
        return this.readChunk(length);

    var buffers = [],
        total = 0;

    while (true) {
        var buffer = this.readChunk();
        if (buffer.length > 0) {
            buffers.push(buffer);
            total += buffer.length;
        }
        else
            break;
    }

    var buffer = new ByteArray(total),
        dest = buffer._bytes,
        copied = 0;

    for (var i = 0; i < buffers.length; i++) {
        var b = buffers[i],
            len = b.length;
        B_COPY(b._bytes, b._offset, dest, copied, len);
        copied += len;
    }

    return new ByteString(dest, 0, copied);
};

IO.prototype.write = IO.prototype.write || function(object, charset) {
    if (object === null || object === undefined || typeof object.toByteString !== "function")
        throw new Error("Argument to IO.write must have toByteString() method");

    var binary = object.toByteString(charset);
    this.writeInto(binary, 0, binary.length);
    
    return this;
};

IO.prototype.puts = function() {
    this.write(arguments.length === 0 ? "\n" : Array.prototype.join.apply(arguments, ["\n"]) + "\n");
}

exports.Peekable = function (input) {
    this._input = input;
    this._buffer = new exports.StringIO();
};

exports.Peekable.prototype.read = function (length) {
    if (arguments.length == 0)
        return this._buffer.read() + this._input.read();
    else if (this._buffer.length)
        return this._buffer.read(length);
    else 
        return this._input.read(length);
};

exports.Peekable.prototype.peek = function (length) {
    while (this._buffer.length < length) {
        var read = this._input.read(length - this._buffer.length);
        if (!read.length)
            break;
        this._buffer.write(read);
    }
    return this._buffer.substring(0, length);
};

