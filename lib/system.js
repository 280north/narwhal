
/* stub for migration from platform to system */
var platform = require('./platform');

exports.env = platform.ENV;
exports.args = platform.ARGV;
exports.stdin = platform.STDIN;
exports.stdout = platform.STDOUT;
exports.stderr = platform.STDERR;
exports.fs = require('./file');

