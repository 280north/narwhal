
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var IO = require('./io').IO;

exports.IO = function (url) {
    return new IO(
        new java.net.URL(url).openStream(),
        null
    );
};

