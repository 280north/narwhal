
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- Richard Penwell (penwellr) MIT Licence - March 1, 2010
//     * Contributed "OS.parse"


var engine = require('os-engine');
for (var name in engine) {
    if (Object.prototype.hasOwnProperty.call(engine, name)) {
        exports[name] = engine[name];
    }
}

var system = require("system");

/**
 * executes a given command, attached to this process's
 * IO streams, and returns the exit status.
 *
 * @param {Array or String} command uses "/bin/sh -c" if the command
 * is a string.
 * @returns Number exit status
 */
if (!exports.system) {
    exports.system = function (command, options) {
        var process = exports.popen(command, options);
        return process.communicate(
            system.stdin,
            system.stdout,
            system.stderr
        ).status;
    };
}

/**
 * executes a given command quietly and returns
 * the exit status.
 *
 * @param {Array or String} command uses "/bin/sh -c" if the command
 * is a string.
 * @returns Number exit status
 */
exports.status = function (command) {
    var process = exports.popen(command);
    var result = process.communicate();
    return result.status;
};

/**
 * executes a given command and returns the
 * standard output.  If the exit status is non-zero,
 * throws an Error.
 *
 * @param {Array or String} command uses "/bin/sh -c" if the command
 * is a string.
 * @returns String the standard output of the command
 */
exports.command = function (command) {
    var process = exports.popen(command);
    var result = process.communicate();
    if (result.status !== 0)
        throw new Error("(" + result.status + ") " + result.stderr.read());
    return result.stdout.read();
};

/**
 * enquotes a string such that it is guaranteed to be a single
 * argument with no interpolated values for a shell.
 *
 * /!\ WARNING: as yet, this implementation only handles
 * enquoting for Unix shell script style arguments.  Further
 * development is necessary to enquote and escape arguments
 * on Windows.
 */
exports.enquote = function (word) {
    return "'" + String(word).replace(/'/g, "'\"'\"'") + "'";
};

/**
 * parses command line arguments
 * @param command {String} a command composed of space delimited,
 * quoted, or backslash escaped arguments.
 * @returns an Array of unquoted arguments.
 *
 * /!\ WARNING: this does not handle all of the edge cases
 * of command line argument parsing, nor is suitable for
 * general purpose argument enquoting on all platforms.  It
 * also will never be able to handle environment variable
 * interpolation or other forms of shell quote expansion.
 * This utility is used by Narwhal to pare arguments from
 * system.env.NARWHAL_OPT.
 */

var STATE_NORMAL    = 0; // waiting for non whitespace/quote
var STATE_ARG       = 1; // nextArg is an argument, even if empty
var STATE_IN_QUOTE  = 2; // within a ' or " quote

exports.parse = function (argString) {
    var args = [];

    var nextArg = "";
    var state = STATE_NORMAL;
    var escapeNext = false;
    var delimiter;

    var tokens = argString.split("");
    while (tokens.length > 0) {
        var token = tokens.shift();

        if (state === STATE_NORMAL || state === STATE_ARG) {
            if (!escapeNext && token === "\\") {
                escapeNext = true;
            }
            else if (escapeNext) {
                state = STATE_ARG;
                escapeNext = false;
                nextArg += token;
            }
            else if (token === "'" || token === '"') {
                delimiter = token;
                state = STATE_IN_QUOTE;
            }
            else if (token === " ") {
                if (state === STATE_ARG) {
                    args.push(nextArg);
                    nextArg = "";
                }
                state = STATE_NORMAL;
            }
            else {
                nextArg += token;
                state = STATE_ARG;
            }
        }
        else if (state === STATE_IN_QUOTE) {
            if (!escapeNext && token === "\\") {
                escapeNext = true;
            }
            else if (delimiter === token) {
                if (escapeNext) {
                    nextArg += token;
                    escapeNext = false;
                } else {
                    state = STATE_ARG;
                }
            }
            else {
                if (escapeNext) {
                    // if not a quote (above) or other special character that needs to be escaped then include the backslash
                    if (token !== "\\")
                        nextArg += "\\";
                    nextArg += token;
                    escapeNext = false;
                } else {
                    nextArg += token;
                }
            }
        }
        else {
            throw "wtf " + state;
        }
    }

    if (state === STATE_IN_QUOTE) {
        if (token === delimiter) {
            args.push(nextArg.slice(0,-1) + "\\");
        }
        else {
            // throw "Invalid or not yet implemented case"
        }
    }
    else if (state === STATE_ARG) {
        args.push(nextArg);
    }

    return args;
};

