
var io = require('io');

var cLib;
var getCLib = function () {
    if (!cLib) {
        var jna = Packages.com.sun.jna;
        cLib = jna.NativeLibrary.getInstance(
            jna.Platform.isWindows() ? "msvcrt" : "c"
        );
    }
    return cLib;
}

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

var cSystem;
var getCSystem = function () {
    if (!cSystem)
        cSystem = getCLib().getFunction("system");
    return cSystem;
};

exports.system = function (command) {
    if (Array.isArray(command)) {
        command = command.map(function (arg) {
            return require("os").enquote(arg);
        }).join(" ");
    }
    return getCSystem().invokeInt([command]);
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
    if (!options)
        options = {};
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
        stderr: stderr,
        communicate: function (input, output, errput) {

            if (typeof stdin == "string")
                stdin = new io.StringIO(input);
            else if (!stdin)
                stdin = new io.StringIO();

            if (typeof input == "string")
                input = new io.StringIO(input);
            else if (!input)
                input = new io.StringIO();
            if (!output)
                output = new io.StringIO();
            if (!errput)
                errput = new io.StringIO();

            var inThread = new JavaAdapter(Packages.java.lang.Thread, {
                "run": function () {
                    input.copy(stdin);
                    stdin.close();
                }
            });

            var outThread = new JavaAdapter(Packages.java.lang.Thread, {
                "run": function () {
                    stdout.copy(output);
                    stdout.close();
                }
            });

            var errThread = new JavaAdapter(Packages.java.lang.Thread, {
                "run": function () {
                    stderr.copy(errput);
                    stderr.close();
                }
            });

            inThread.setDaemon(true);
            inThread.start();
            errThread.setDaemon(true);
            errThread.start();
            outThread.setDaemon(true);
            outThread.start();

            inThread.join();
            outThread.join();
            errThread.join();

            var status = process.waitFor();
            stdin.close();
            stdout.close();
            stderr.close();

            return {
                status: status,
                stdin: input,
                stdout: output,
                stderr: errput
            };
        }
    }
};

