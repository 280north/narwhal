
    popen(process):Popen

process may be a String or Array of args.  If it is a String, popen uses "/bin/sh", "-e" to execute your program.

Popen
-----

Returns an object with the following properties:

* `stdin IO` - a text writer IO object attached to the stdin of subprocess.
* `stdout IO` - a text reader IO object attached to the stdout of the
  supbrocess.
* `stderr IO` - a text reader IO object attached to the stderr of the
  subprocess.
* `wait() Number` - blocks on the subprocess until it exits and returns the
  exit status code.
* `communicate(stdin_opt, stdout_opt, stderr_opt) Communicate` - communicates
  with the process on `stdin`, `stdout`, and `stderr` concurrently with the
  attached streams.  The given `stdin` may be an IO stream, String, or StringIO
  stream.  `stdout` and `stderr` may be streams or `StringIO` objects, and
  default to `StringIO`.  `communicate` returns the streams used to communicate
  with `stdin`, `stdout`, and `stderr`, by default providing `stdout` and
  `stderr` as `StringIO` objects that have accumulated the entire output and
  errput of the subprocess.

Communicate
-----------

* `stdin` - the text reader object used to communicate with the subprocess.  If
  no `stdin` was provided as an argument to `communicate`, `stdin` will be an
  empty `StringIO`.  If a String was provided, `stdin` will be a `StringIO`
  with whatever input was not consumed by the subprocess.  If any other stream
  was provided, `stdin` will be that stream.
* `stdout` - the text writer object that the subprocess wrote to on `stdout`.
  If no `stdout` was provided as an argument to `communicate`, `stdout` will be
  a `StringIO` containing all of the accumulated output of the subprocess.
* `stderr` - the text writer object that the subprocess wrote to on stderr.  If
  no `stderr` was provided as an argument to `communicate`, `stderr` will be a
  `StringIO` containing all of the accumulated errput of the subprocess.
* `status` - the exit status code of the subprocess

Examples
--------

This is the implementation of "system" in the "os" module:

    OS.system = function (command, options) {
        var process = OS.popen(command, options);
        return process.communicate(
            system.stdin,
            system.stdout,
            system.stderr
        ).status;
    };

This is the implementation of the "command" function in the "os" module.  "command" executes a subprocess and returns all of the output of the subprocess as a String.  If the exit status code of the subprocess is non-zero, it throws an error containing all of the accumulated errput of the subprocess.

    OS.command = function (command) {
        var process = OS.popen(command);
        var result = process.communicate();
        if (result.status !== 0)
            throw new Error(result.stderr.read());
        return result.stdout.read();
    };

This function uses the "sort" command to sort a list of numbers.

    var IO = require("io");
    var OS = require("os");
    
    var list = IO.StringIO();
    list.print("30");
    list.print("4");
    list.print("1000");
    list.print("200");
    
    var process = OS.popen(["sort", "-n", "-"]);
    process.communicate(list).stdout.forEach(print);

