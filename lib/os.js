
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- penwellr TODO
//     contributed "parse"

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
exports.parse = function (args) {
    var startsWith = function(self, str) {
        return (self.match("^"+str.replace('\\', '\\\\'))==str)
    }
    var endsWith = function(self, str) {
        return (self.match(str.replace('\\', '\\\\')+"$")==str)
    }
    var results = [], quoteType = null, quotedElement = null;
    args.split(' ').forEach(function(element) {
        if (
            quoteType || endsWith(element, '\\') ||
            startsWith(element, '\'') || startsWith(element, '"')
        ) {
            if (quoteType) {
                if (endsWith(element, quoteType)) {
                    results.push(
                        quotedElement + " " +
                        element.substring(0, element.length - 1)
                    );
                quotedElement = null;
                quoteType = null;
                return;
            }
            else { quotedElement += " " + element; return; }
        }
        if (!quoteType && startsWith(element, '\'')) {
            quoteType = '\'';
            quotedElement = element.substring(1, element.length);
            return;
        }
        if (!quoteType && startsWith(element, '"')) {
            quoteType = '"';
            quotedElement = element.substring(1, element.length);
                return;
            }
            if (!quoteType) {
                if (endsWith(element, '\\')) {
                    if (quotedElement) {
                        quotedElement += " " + element.substring(
                            0,
                            element.length - 1
                        );
                    }
                    else {
                        quotedElement = element.substring(
                            0,
                            element.length - 1
                        );
                    }
                }
                else {
                    results.push(quotedElement + ' ' + element);
                    quotedElement = null;
                    return;
                }
            }
        }
        else {
            if (quotedElement) {
                results.push(quotedElement + ' ' + element);
                quotedElement = null;
            }
            else {
                results.push(element);
            }
        }
    });
    return results;
};

