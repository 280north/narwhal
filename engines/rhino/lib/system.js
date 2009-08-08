
var io = require("./io");

exports.stdin  = new io.TextInputStream(new io.IO(Packages.java.lang.System['in'], null));
exports.stdout = new io.TextOutputStream(new io.IO(null, Packages.java.lang.System.out));
exports.stderr = new io.TextOutputStream(new io.IO(null, Packages.java.lang.System.err));

exports.args = global.arguments || [];

exports.env = {};

var env = Packages.java.lang.System.getenv(),
    keyIterator = env.keySet().iterator();
while (keyIterator.hasNext()) {
    var key = keyIterator.next();
    exports.env[String(key)] = String(env.get(key));
}

exports.fs = require('./file');

// default logger
var Logger = require("./logger").Logger;
exports.log = new Logger(exports.stderr);

