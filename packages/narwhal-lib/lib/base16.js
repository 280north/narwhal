
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- cadorn Christoph Dorn

var util = require('narwhal/util');
var binary = require('binary');
var struct = require('struct');

exports.encode = function (n) {
    var length = n.length;
    var result = [];
    var alphabet = struct.alphabet16Upper;
    for (var i = 0; i < length; i++) {
        n[i] = n[i] & 0xFF;
        result.push(alphabet[(n.charCodeAt(i) >>> 4) & 0xF], alphabet[n.charCodeAt(i) & 0xF]);
    }
    return result.join('');
};

