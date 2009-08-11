
; popen(process):Popen
: process may be a String or Array of args.  If it is a String, popen uses "/bin/sh", "-e" to execute your program.

Popen
-----

; stdin
: a text writer IO object attached to the stdin of subprocess.
; stdout
: a text reader IO object attached to the stdout of the supbrocess.
; stderr
: a text reader IO object attached to the stderr of the subprocess.

; wait() -> code:Number
: blocks execution until the subprocess has exited.

; communicate([stdin[, stdout[, stderr]]]):Communicate
: communicates with the process on stdin, stdout, and stderr concurrently with the attached streams.  the given stdin may be a stream, string, or stringio stream.  stdout and stderr may be streams or stringio objects, and default to stringio.  communicate returns the pipes used to communicate with stdin, stdout, and stderr, by default providing stdout and stderr as stringio objects that have accumulated the entire output and errput of the subprocess.

Communicate
-----------

; stdin
: the text reader object used to communicate with the subprocess.  if no stdin was provided as an argument to communicate, stdin will be an empty stringio.  if a string was provided, stdin will be a stringio with whatever input was not consumed by the subprocess.  if any other stream was provided, stdin will be that stream.
; stdout
: the text writer object that the subprocess wrote to on stdout.  if no stdout was provided as an argument to communicate, stdout will be a stringio containing all of the accumulated output of the subprocess.
; stderr
: the text writer object that the subprocess wrote to on stderr.  if no stderr was provided as an argument to communicate, stderr will be a stringio containing all of the accumulated errput of the subprocess.
; code
: the exit code of the subprocess

Examples
--------

This is the implementation of "system" in the "os" module:

 exports.system = function (command, options) {
     var process = exports.popen(command, options);
     return process.communicate(
         '',
         system.stdout,
         system.stderr
     ).code;
 };

This is the implementation of the "command" function in the "os" module.  "command" executes a subprocess and returns all of the output of the subprocess as a String.  If the exit status code of the subprocess is non-zero, it throws an error containing all of the accumulated errput of the subprocess.

 exports.command = function (command) {
     var process = exports.popen(command);
     var result = process.communicate();
     if (result.code !== 0)
         throw new Error(result.stderr.read());
     return result.stdout.read();
 };

This function uses the "sort" command to sort a list of numbers.

 var io = require("io");
 var os = require("os");
 
 var list = io.StringIO();
 list.print("30");
 list.print("4");
 list.print("1000");
 list.print("200");
 
 var process = os.popen(["sort", "-n", "-"]);
 process.communicate(list).stdout.forEach(print);

