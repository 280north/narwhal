(function (fixtures) {

// global reference
global = fixtures.global;
print = fixtures.print; // this is non-standard as yet

// Securable Modules compatible "require" method
// https://wiki.mozilla.org/ServerJS/Modules/SecurableModules

global.system = {};
system.print = fixtures.print;
system.debug = fixtures.debug;
system.prefix = fixtures.prefix;
system.platform = fixtures.platform;
system.platforms = fixtures.platforms;
system.evalGlobal = fixtures.evalGlobal;

// logger shim
var shim = function () {
    if (system.debug && system.print) {
        system.print(Array.prototype.join.apply(arguments, [" "]));
    }
};
var log = {fatal:shim, error:shim, warn:shim, info:shim, debug:shim};
system.log = log;

// fs shim
var fs = {
    read : fixtures.read,
    isFile : fixtures.isFile
}
system.fs = fs;

/* the narwhal installation prefix */
var prefix = fixtures.prefix;

var sandboxFactory = fixtures.evaluate(fixtures.read(prefix + "/lib/sandbox.js"), "sandbox.js", 1);
var sandbox = {};

sandboxFactory(null, sandbox, system);


var loader = sandbox.Loader({ paths : fixtures.path.split(":") });
global.require = sandbox.Sandbox({loader: loader, modules: {system: system}});


try {
    require("global");
} catch (e) {
    system.log.error("Couldn't load global/primordial patches ("+e+")");
}

require.force("system");

// load packages
try {
    require("packages");
} catch (e) {
    system.log.error("Couldn't load packages ("+e+")");
}

// load the program module
if (system.args.length)
    require(system.args.shift());
else
    require("repl").repl();

/* send an unload event if that module has been required */
if (require.loader.isLoaded('unload')) {
    require('unload').send();
}

})
