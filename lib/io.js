// IO: platform independent

var implementation = require("io-platform");

for (var name in implementation) {
    if (Object.prototype.hasOwnProperty.call(implementation, name)) {
        exports[name] = implementation[name];
    }
};

exports.IO.prototype.puts = function() {
    this.write(arguments.length === 0 ? "\n" : Array.prototype.join.apply(arguments, ["\n"]) + "\n");
}

