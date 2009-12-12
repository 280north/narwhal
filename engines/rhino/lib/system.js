
var io = require("./io");

exports.print = function () {
    exports.stdout.write(Array.prototype.join.call(arguments, ' ') + "\n").flush();
};

exports.stdin  = new io.TextInputStream(new io.IO(Packages.java.lang.System['in'], null));
exports.stdout = new io.TextOutputStream(new io.IO(null, Packages.java.lang.System.out));
exports.stderr = new io.TextOutputStream(new io.IO(null, Packages.java.lang.System.err));

exports.args = global.arguments || [];
exports.originalArgs = exports.args.slice(0);

exports.env = {};

var env = Packages.java.lang.System.getenv(),
    keyIterator = env.keySet().iterator();
while (keyIterator.hasNext()) {
    var key = keyIterator.next();
    exports.env[String(key)] = String(env.get(key));
}

var securityManager = Packages.java.lang.System.getSecurityManager()
if (securityManager) {
    var securityManagerName = securityManager.getClass().getName();
    if (/^com.google.app(engine|hosting)./.test(securityManagerName))
        exports.appEngine = true;
    if (/^com.google.apphosting\./.test(securityManagerName))
        exports.appEngineHosting = true;
}

exports.fs = require('./file');

// default logger
var Logger = require("./logger").Logger;
exports.log = new Logger(exports.stderr);

