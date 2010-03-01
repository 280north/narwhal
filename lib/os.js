
// Kris Kowal
// Richard Penwell (penwellr) MIT Licence - March 1, 2010

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

exports.parse = function (args)
{
    var startsWith = function(self, str) { return (self.match("^"+str.replace('\\', '\\\\'))==str) }
    var endsWith = function(self, str) { return (self.match(str.replace('\\', '\\\\')+"$")==str) }
    var results = [], quoteType = null, quotedElement = null;
    args.split(' ').forEach(function(element) {
        if (quoteType || endsWith(element, '\\') || startsWith(element, '\'') || startsWith(element, '"')) {
            if (quoteType) {
                if (endsWith(element, quoteType)) {
                    results.push(quotedElement + " " + element.substring(0, element.length - 1));
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
                    if (quotedElement) { quotedElement += " " + element.substring(0, element.length - 1); }
                    else { quotedElement = element.substring(0, element.length - 1); }
                }
                else { results.push(quotedElement + ' ' + element); quotedElement = null; return; }
            }
        }
        else {
            if (quotedElement) { results.push(quotedElement+' '+element); quotedElement = null;}
            else { results.push(element); }
        }
    });
    return results;
}