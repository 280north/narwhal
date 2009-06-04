
var implementation = require('http-platform');

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

