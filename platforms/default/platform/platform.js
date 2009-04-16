var IO = require("../io").IO;

exports.STDIN  = new IO(function(){}, null);
exports.STDOUT = new IO(null, function(string) { print(String(string).replace(/\n$/,"")); });
exports.STDERR = new IO(null, function(string) { print(String(string).replace(/\n$/,"")); });

exports.ARGV = global.arguments || [];

exports.ENV = {};

