var IO = require("../../io").IO;

var defaultStream = {
    write : function(string) {
        if (typeof print !== "undefined")
            print(String(string).replace(/\n$/,"")); // hack to strip last newline since print adds one
    }
};

exports.STDOUT = new IO(null, defaultStream);
exports.STDERR = new IO(null, defaultStream);

exports.ARGV = global.arguments || [];

exports.ENV = {};
