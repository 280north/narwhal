
var IO = require("./io").IO;

exports.stdin  = new IO(Packages.java.lang.System['in'], null);
exports.stdout = new IO(null, Packages.java.lang.System.out);
exports.stderr = new IO(null, Packages.java.lang.System.err);

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
var Logger = require("logger").Logger;
exports.log = new Logger(exports.stdout);
