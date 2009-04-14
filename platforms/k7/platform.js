var IO = require("./io").IO;

exports.STDIN  = new IO(function(){}, null);
exports.STDOUT = new IO(null, function(string) { print(String(string).replace(/\n$/,"")); });
exports.STDERR = new IO(null, function(string) { print(String(string).replace(/\n$/,"")); });

exports.ARGV = ENV["argv"].slice(2);

exports.ENV = {};

for (var key in ENV)
    if (key !== "argc" && key !== "argv")
        exports.ENV[key] = ENV[key];

print("exports.ARGV="+exports.ARGV)
