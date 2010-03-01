
// Kris Kowal
// Sergey Berezhnoy

var implementation = require('http-engine');

var fs = require("file");

exports.open = function (url, mode, options) {
    // todo mode negotiation, particularly for binary vs text buffering
    return new implementation.IO(url);
};

exports.read = function (url) {
    var stream = exports.open(url);
    try {
        return stream.read();
    } finally {
        stream.close();
    }
};

exports.copy = function (source, target, mode) {
    mode = mode || 'b';
    fs.path(target).write(exports.read(source, mode), mode);
};
