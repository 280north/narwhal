
var platform = require('os-platform');
for (var name in platform) {
    if (Object.prototype.hasOwnProperty.call(platform, name)) {
        exports[name] = platform[name];
    }
}

exports.command = function (command) {
    var process = exports.popen(command);
    var result = process.communicate();
    if (result.code !== 0)
        throw new Error(result.stderr);
    return result.stdout;
};

exports.enquote = function (word) {
    return "'" + String(word).replace(/'/g, "'\"'\"'") + "'";
};

