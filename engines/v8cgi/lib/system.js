
var IO = require("./io").IO;

exports.stdin = system.stdin;
exports.stdout = system.stdout;
exports.stderr = system.stderr;

exports.args = system.args;

exports.env = system.env;

exports.fs = require('./file');

// default logger
var Logger = require("./logger").Logger;
exports.log = new Logger(exports.stderr);

