(function (fixtures) {

var system = {};
system.print = fixtures.print;
system.debug = fixtures.debug;
system.prefix = fixtures.prefix;
system.platform = fixtures.platform;
system.platforms = fixtures.platforms;
system.evalGlobal = fixtures.evalGlobal;

system.evaluate = fixtures.evaluate;

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

// global reference
global = fixtures.global;
global.print = fixtures.print;
global.system = system;

// equivalent to "var sandbox = require('sandbox');"
var sandboxFactory = fixtures.evaluate(fixtures.read(fixtures.prefix + "/lib/sandbox.js"), "sandbox.js", 1);
var sandbox = {};
sandboxFactory(null, sandbox, system);

// create the primary Loader and Sandbox:
var loader = sandbox.Loader({ paths : fixtures.path.split(":") });
global.require = sandbox.Sandbox({loader: loader, modules: { system: system }});

try {
    require("global");
} catch (e) {
    system.log.error("Couldn't load global/primordial patches ("+e+")");
}

require.force("system");

// load the program module
if (system.args.length) {

    var program = system.fs.path(system.args.shift());

    if (program.isDirectory()) {
        if (!program.join('package.json').isFile())
            throw new Error("Program directory does not contain a package.json");
        system.prefix = program.join('').toString();
    }

    // load packages
    var packages;
    try {
        packages = require("packages");
    } catch (e) {
        system.log.error("Warning: Couldn't load packages. Packages won't be available. ("+e+")");
    }

    if (program.isDirectory()) {
        require(packages.root.directory.resolve(packages.root.main || 'main').toString());
    } else {
        require(program.toString());
    }

}
//else
//    require("repl").repl();

/* send an unload event if that module has been required */
if (require.loader.isLoaded('unload')) {
    require('unload').send();
}

})
