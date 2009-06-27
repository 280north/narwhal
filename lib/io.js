// IO: platform independent

var implementation = require("io-platform");

for (var name in implementation) {
    if (Object.prototype.hasOwnProperty.call(implementation, name)) {
        exports[name] = implementation[name];
    }
};

exports.IO.prototype.puts = function() {
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

