
var IO = require("./io").IO;

exports.stdin  = new IO(function(){}, null);
exports.stdout = new IO(null, function(string) { print(String(string).replace(/\n$/,"")); });
exports.stderr = new IO(null, function(string) { print(String(string).replace(/\n$/,"")); });

exports.args = global.arguments || [];

exports.env = {};

exports.fs = require('./file');

// default logger
var Logger = require("logger").Logger;
exports.log = new Logger(exports.stdout);
