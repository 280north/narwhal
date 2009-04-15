
/* stub for migration from platform to system */
var system = require('./system');

exports.ENV = system.env;
exports.ARGV = system.args;
exports.STDIN = system.stdin;
exports.STDOUT = system.stdout;
exports.STDERR = system.stderr;

