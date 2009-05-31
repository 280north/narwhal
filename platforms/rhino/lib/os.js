
var io = require('io');

exports.exit = function (status) {
    Packages.java.lang.System.exit(status << 0);
};

exports.sleep = function (seconds) {
    Packages.java.lang.Thread.sleep((seconds * 1000) >>> 0);
};

exports.fork = function () {
};

exports.exec = function () {
};

exports.dup = function () {
};

exports.dup2 = function () {
};

exports.setsid = function () {
};

exports.getpid = function () {
};

var javaRuntime = function () {
    return Packages.java.lang.Runtime.getRuntime();
};

var javaPopen = function (command) {
    return javaRuntime().exec(command);
};

exports.popen = function (command, options) {
    // todo options: "b", {charset, shell}
    if (typeof command == "string")
        command = ["sh", "-c", command];
    var process = javaPopen(command);
    var stdin = new io.TextOutputStream(new io.IO(null, process.getOutputStream()));
    var stdout = new io.TextInputStream(new io.IO(process.getInputStream()));
    var stderr = new io.TextInputStream(new io.IO(process.getErrorStream()));
    return {
        wait: function () {
            return process.waitFor();
        },
        stdin: stdin,
        stdout: stdout,
        stderr: stderr
        // todo: communicate([input])
    }
};

exports.system = function (command) {
    if (typeof command == "string")
        command = ["sh", "-c", command];
    var process = exports.popen(command);
    process.stdout.close();
    process.stdin.close();
    /// TODO should communicate on all streams
    return process.wait();
};

exports.command = function (command) {
    var process = exports.popen(command);
    /// TODO should communicate on all streams
    var result = process.stdout.read();
    var code = process.wait();
    if (code !== 0)
        throw new Error(process.stderr.read());
    return result;
};

exports.enquote = function (word) {
    return "'" + String(word).replace(/'/g, "'\"'\"'") + "'";
};

