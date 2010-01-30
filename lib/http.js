
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- cadorn Christoph Dorn TODO
// -- veged Sergey Berezhnoy TODO

var implementation = require('http-engine');

exports.open = function (url, mode, options) {
    // TODO mode negotiation, particularly for binary vs text buffering
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

// TODO resolve the source as a file URL
exports.copy = function (source, target, mode) {
    mode = mode || 'b';
    fs.path(target).write(exports.read(source, mode), mode);
};

