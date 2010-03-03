
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var IO = require('io');

var cLib;
var getCLib = function () {
    var jna = Packages.com.sun.jna;
    cLib = jna.NativeLibrary.getInstance(
        jna.Platform.isWindows() ? "msvcrt" : "c"
    );
    getCLib = function () {
        return cLib;
    };
    return cLib;
};

exports.exit = function (status) {
    // send an unload event if that module has been required
    if (require.loader.isLoaded("unload")) {
        require("unload").send();
    }
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
    cSystem = getCLib().getFunction("system");
    getCSystem = function () {
        return cSystem;
    };
    return cSystem;
};

exports.system = function (command) {
    if (Array.isArray(command)) {
        command = command.map(function (arg) {
            return require("os").enquote(arg);
        }).join(" ");
    }
    return getCSystem().invokeInt([command]) >> 8;
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
    options = options || {};
    if (typeof command == "string")
        command = ["sh", "-c", command];

    var process = javaPopen(command);

    var stdin = new IO.TextOutputStream(new IO.IO(null, process.getOutputStream()),
        options.buffering, options.lineBuffering, options.charset);
    var stdout = new IO.TextInputStream(new IO.IO(process.getInputStream()), options.buffering,
        options.lineBuffering, options.charset);
    var stderr = new IO.TextInputStream(new IO.IO(process.getErrorStream()),
        options.buffering, options.lineBuffering, options.charset);

    return {
        wait: function () {
            return process.waitFor();
        },
        stdin: stdin,
        stdout: stdout,
        stderr: stderr,
        communicate: function (input, output, errput) {

            if (typeof stdin == "string")
                stdin = new IO.StringIO(input);
            else if (!stdin)
                stdin = new IO.StringIO();

            if (typeof input == "string")
                input = new IO.StringIO(input);
            else if (!input)
                input = new IO.StringIO();
            if (!output)
                output = new IO.StringIO();
            if (!errput)
                errput = new IO.StringIO();

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

