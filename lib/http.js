
// Kris Kowal

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

exports.readTo = function (url, target, mode) {
    mode = mode || 'b';
    fs.path(target).write(exports.read(url, mode), mode);
};
