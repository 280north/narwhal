print(2)
var IO = require("./io").IO;
print(IO.toSource())
exports.stdin  = null;/*TODO*/
print(3)
exports.stdout = null;/*TODO*/
exports.stderr = null;/*TODO*/

exports.args = global.arguments || [];

exports.env = {}; /*TODO*/
print(4)
exports.fs = require('./file');
print(5)
// default logger
var Logger = require("logger").Logger;
print(6)
exports.log = new Logger(exports.stdout);

