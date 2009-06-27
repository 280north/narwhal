
var IO = require("./io").IO;

exports.stdin  = null;
exports.stdout = null;
exports.stderr = null;

exports.args = bootloader.args;

exports.env = {"bootloader": bootloader};

exports.fs = require('./file');

// default logger
var Logger = require("logger").Logger;
exports.log = new Logger(exports.stdout);
