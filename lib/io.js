// IO: platform independent

var IO = exports.IO = require("platform/io").IO;

IO.prototype.puts = function() {
    this.write(arguments.length === 0 ? "\n" : Array.prototype.join.apply(arguments, ["\n"]) + "\n");
}
