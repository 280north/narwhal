
// Kris Kowal

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
 */
exports.enquote = function (word) {
    return "'" + String(word).replace(/'/g, "'\"'\"'") + "'";
};

