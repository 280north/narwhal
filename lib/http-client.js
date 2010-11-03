
// -- isaacs Isaac Schleuter TODO
// -- airportyh TODO
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- cadorn Christoph Dorn TODO
// -- veged Sergey Berezhnoy TODO
// -- tlrobinson Tom Robinson

var ENGINE = require("http-client-engine");
var FILE = require("file");

exports.open = function (url, mode, options) {
    // todo mode negotiation, particularly for binary vs text buffering
    mode = mode || "b";
    options = options || {};

    options.method = options.method || "GET";
    options.headers = options.headers || {};
    if (options.followRedirects === undefined)
        options.followRedirects = true;

    return ENGINE.open(url, mode, options);
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
    return FILE.path(target).write(exports.read(source, mode), mode);
};
