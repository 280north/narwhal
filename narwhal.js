(function (modules) {

if (modules.fs) {
    // XXX: migration step for deprecated engines
    var system = modules;
    var file = system.fs;
    var modules = {system: system, file: file};
    system.print(
        "WARNING: this version of the " + system.engine + " engine \n" +
        "         is deprecated because it injects the system module \n" +
        "         instead of a modules memo in the narwhal bootstrap system."
    );
} else {
    var system = modules.system;
    var file = modules.file;
}

// global reference
// XXX: beyond-compliance with CommonJS
global = system.global;
global.global = global;
global.system = system;
global.print = system.print;

// this only works for modules with no dependencies and a known absolute path
var requireFake = function(id, path, force) {
    // when a real require is ready, use it instead
    if (require)
        require(id);
    // if the module has already been loaded,
    //  and this isn't a forced reload,
    //  return the memoized exports
    if (modules[id] && !force)
        return modules[id];

    var exports = modules[id] = modules[id] || {};
    var module = {id: id, path: path};


    var factory = system.evaluate(file.read(path), path, 1);
    factory(
        requireFake, // require
        exports, // exports
        module, // module
        system, // system
        system.print // print
    );

    return exports;
};

// bootstrap sandbox and loader modules
var loader = requireFake("loader", system.prefix + "/lib/loader.js");
var multiLoader = requireFake("loader/multi", system.prefix + "/lib/loader/multi.js");
var sandbox = requireFake("sandbox", system.prefix + "/lib/sandbox.js");

// bootstrap file module
requireFake("file", system.prefix + "/lib/file-bootstrap.js", "force");

system.enginePrefix = system.enginePrefix || system.prefix + '/engines/' + system.engines[0];

// construct the initial paths
var paths = [];
// XXX system.packagePrefixes deprecated in favor of system.prefixes
var prefixes = system.prefixes || system.packagePrefixes || [system.prefix];
for (var i = 0; i < prefixes.length; i++) {
    var prefix = prefixes[i];
    for (var j = 0; j < system.engines.length; j++) {
        var engine = system.engines[j];
        paths.push(prefixes[i] + "/engines/" + engine + "/lib");
    }
    paths.push(prefixes[i] + "/lib");
}

// create the primary Loader and Sandbox:
var loader = multiLoader.MultiLoader({
    paths: paths,
    debug: system.verbose
});
if (system.loaders) {
    loader.loaders.unshift.apply(loader.loaders, system.loaders);
    delete system.loaders;
}
var require = global.require = sandbox.Sandbox({
    loader: loader,
    modules: modules,
    debug: system.verbose
});

// patch the primordials (or: save the whales)
// to bring them up to at least the neighborhood of ES5 compliance.
try {
    require("global");
} catch (e) {
    system.print("Couldn't load global/primordial patches ("+e+")");
}

// load the complete system module
require.force("system");
require.force("file");
require.force("file-engine");

// augment the path search array with those provided in
//  environment variables
paths.push([
    system.env.JS_PATH || "",
    system.env.NARWHAL_PATH || ""
].join(":").split(":").filter(function (path) {
    return !!path;
}));

// parse command line options
var parser = require("narwhal").parser;
var options = parser.parse(system.args);
if (options.debug !== undefined)
    system.debug = options.debug;
var wasVerbose = system.verbose;
if (options.verbose !== undefined) {
    system.verbose = options.verbose;
    require.verbose = system.verbose;
}

// enable loader tracing
global.require.debug = options.verbose;
// in verbose mode, list all the modules that are 
// already loaded
if (!wasVerbose && system.verbose) {
    Object.keys(modules).forEach(function (name) {
        system.print("| " + name);
    });
}

// find the program module and its prefix
var program;
if (system.args.length && !options.interactive && !options.main) {
    if (!program)
        program = file.path(system.args[0]).canonical();

    // add package prefixes for all of the packages
    // containing the program, from specific to general
    var parts = file.split(program);
    for (var i = 0; i < parts.length; i++) {
        var path = file.join.apply(null, parts.slice(0, i));
        var packageJson = file.join(path, "package.json");
        if (file.isFile(packageJson))
            system.prefixes.unshift(path);
    }

}

// user package prefix
if (system.env.SEA)
    system.prefixes.unshift(system.env.SEA);
system.prefixes.unshift.apply(system.prefixes, options.prefixes);

// load packages
var packages;
if (!options.noPackages) {
    packages = require("packages");
    packages.main();
} else {
    packages = {
        catalog: {},
        order: []
    }
}

// run command options
//  -I, --include lib
//  -r, --require module
//  -e, -c , --command command
//  -:, --path delimiter

options.todo.forEach(function (item) {
    var action = item[0];
    var value = item[1];
    if (action == "include") {
        require.paths.unshift(value);
    } else if (action == "require") {
        require(value);
    } else if (action == "eval") {
        system.evalGlobal(value);
    } else if (action == "path") {
        var paths = packages.order.map(function (pkg) {
            return pkg.directory.join("bin");
        }).filter(function (path) {
            return path.isDirectory();
        });
        var oldPaths = system.env.PATH.split(value);
        while (oldPaths.length) {
            var path = oldPaths.shift();
            if (paths.indexOf(path) < 0)
                paths.push(path);
        }
        system.print(paths.join(value));
    }
});

// load the program module
if (options.interactive) {
    require("narwhal/repl").repl();
} else if (options.main) {
    require.main(options.main);
} else if (program) {
    if (program.isDirectory()) {
        require.main(packages.root.directory.resolve(packages.root.main || "main").toString());
    } else {
        require.main(program.toString());
    }
}

// send an unload event if that module has been required
if (require.loader.isLoaded("unload")) {
    require("unload").send();
}

})
