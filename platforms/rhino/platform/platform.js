
var IO = require("./io").IO;

exports.STDIN  = new IO(Packages.java.lang.System['in'], null);
exports.STDOUT = new IO(null, Packages.java.lang.System.out);
exports.STDERR = new IO(null, Packages.java.lang.System.err);

exports.ARGV = global.arguments;

exports.ENV = {};

var env = Packages.java.lang.System.getenv(),
    keyIterator = env.keySet().iterator();
while (keyIterator.hasNext()) {
    var key = keyIterator.next();
    exports.ENV[String(key)] = String(env.get(key));
}

