const Cc = Components.classes;
const Ci = Components.interfaces;

const Env = Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);
const MozConsole = Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService);

var IO = require("./io").IO;
exports.stdin  = null;/*TODO*/
exports.stdout = null;/*TODO*/
exports.stderr = null;/*TODO*/

exports.args = global.arguments || [];

exports.env = {
    // Unfortunate hack to have a fallback mechanism like
    // var foo = system.env['bar'] || system.env['bar']();
    // try {system.env['bar']('foo')} finally {system.env['bar'] = 'foo'}
    __noSuchMethod__: function(name, args) {
        if (args) return Env.set(name, args[0])
        else return Env.exists(name) ? Env.get(name) : null;
    }
};

try { // Hack useing xpconnect to get env varibales from jvm
    var env = Packages.java.lang.System.getenv(),
        keyIterator = env.keySet().iterator();
    while (keyIterator.hasNext()) {
        var key = keyIterator.next();
        exports.env[String(key)] = String(env.get(key));
    }
} catch(e) {}

exports.fs = require('./file');

// default logger
var Logger = require("logger").Logger;
exports.log = new Logger({ print: function(message) {
    print(message);
    MozConsole.logStringMessage(message);
}});
