/*
var IO = require("./io").IO;

exports.stdin  = new IO(function(){}, null);
exports.stdout = new IO(null, function(string) { print(String(string).replace(/\n$/,"")); });
exports.stderr = new IO(null, function(string) { print(String(string).replace(/\n$/,"")); });
*/

exports.args = ENV["argv"].slice(2);

exports.env = {};

for (var key in ENV)
    if (key !== "argc" && key !== "argv")
        exports.env[key] = ENV[key];

delete ENV;

exports.fs = require('./file');

/*
// default logger
var Logger = require("logger").Logger;
exports.log = new Logger(exports.stdout);
*/
