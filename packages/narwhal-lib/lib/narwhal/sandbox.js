
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

// NOTE: this file is used is the bootstrapping process,
// so any "requires" must be accounted for in narwhal.js

var system = require("system");

exports.Sandbox = function (options) {
    options = options || {};
    var loader = options.loader;
    var subsystem = options.system || system || {};
    var exportsMemo = options.modules || {};
    var moduleMemo = {};
    var debug = options.debug !== undefined ? !!options.debug : !!system.debug;
    var debugDepth = 0;
    var main;
    var setDisplayName = (system.engine == "jsc");

    // managed print free variable in the sandbox forwards
    // to system.print in the sandbox
    var subprint = options.print || function () {
        return subsystem.print.apply(subsystem, arguments);
    };

    var sandbox = function (id, baseId, pkg, basePkg, options) {

        if (!options)
            options = {};

        if (sandbox.debug)
            print("REQUIRE: id["+id+"] baseId["+baseId+"] pkg["+pkg+"] basePkg["+basePkg+"]");

        if (loader.resolvePkg) {
            var resolveInfo = loader.resolvePkg(id, baseId, pkg, basePkg);
            id = resolveInfo[0];
            pkg = resolveInfo[1];
        } else {
            id = loader.resolve(id, baseId);
        }

        if (sandbox.debug)
            print("USING: id["+id+"] pkg["+pkg+"]");

        /* populate memo with module instance */
        if (!Object.prototype.hasOwnProperty.call(exportsMemo, id) || options.force || options.once) {

            if (sandbox.debug)
                print(new Array(++debugDepth + 1).join("\\") + " " + id, 'module');

            var globals = {};
            if (sandbox.debug) {
                // record globals
                for (var name in global)
                    globals[name] = true;
            }

            var exports;
            if (options.once) {
                exports = {};
            } else {
                if (!Object.prototype.hasOwnProperty.call(exportsMemo, id) || options.reload)
                    exports = exportsMemo[id] = {};
                exports = exportsMemo[id];
            }

            if (options.reload)
                loader.reload(id);

            var factory;
            try {
                factory = loader.load(id);
            } finally {
                // poor man's catch and rethrow (Rhino sets file/line to where the exception is thrown, not created)
                if (!factory) {
                    delete exportsMemo[id];
                    if (sandbox.debug)
                        debugDepth--;
                }
            }

            var require = Require(id, pkg);
            var load = Load(id, pkg);
            var module
                = moduleMemo[id]
                = moduleMemo[id] || Module(id, factory.path);
            if (pkg) {
                module["package"] = pkg;
                module.using = (
                    pkg && loader.usingCatalog && loader.usingCatalog[pkg] ?
                    loader.usingCatalog[pkg]["packages"] :
                    {}
                );
            }

            // this shim supports both the old factory(r, e, m, s, p) and
            // new factory(scope) module constructor conventions
            var scope = require;

            // require.once provides a scope of extra stuff to inject
            if (options.scope) {
                for (var name in options.scope) {
                    if (Object.prototype.hasOwnProperty.call(options.scope, name)) {
                        scope[name] = options.scope[name];
                    }
                }
            }

            scope.load = load;
            scope.require = require;
            scope.exports = exports;
            scope.module = module;
            scope.system = subsystem;
            scope.print = subprint;

            var completed;
            try {
                factory(scope, exports, module, subsystem, subprint);
                completed = true;
            } finally {
                if (!completed) {
                    delete exportsMemo[id];
                    delete moduleMemo[id];
                }
            }

            /*
            // XXX to be uncommented when the above shim is
            // no longer needed for migration
            var scope = options.scope || {};
            scope.load = load;
            scope.require = require;
            scope.exports = exports;
            scope.module = module;
            scope.system = subsystem;
            scope.print = subprint;
            factory(scope);
            */

            if (sandbox.debug) {
                // check for new globals
                for (var name in global)
                    if (!globals[name])
                        system.print("NEW GLOBAL: " + name);
            }

            if (sandbox.debug)
                print(new Array(debugDepth-- + 1).join("/") + " " + id, 'module');

            // set fn.displayName on exported functions for better debugging
            if (setDisplayName) {
                var displayID = id.replace(/[^\w]/g, "_").toUpperCase();
                for (var name in exports) {
                    if (typeof exports[name] === "function" && !exports[name].displayName &&
                            Object.prototype.hasOwnProperty.call(exports, name)) {
                        exports[name].displayName = displayID+"."+name;
                    }
                }
            }

        } else {
            if (sandbox.debug > 1)
                print(new Array(debugDepth + 1).join("|") + " " + id, 'module');
            exports = exportsMemo[id];
            if (moduleMemo[id]) {
                moduleMemo[id].setExports = function () {
                    throw new Error("Cannot set exports after a module has been required by another module.");
                };
            }
        }

        /* support curryId for modules in which it is requested */
        var imports = {};
        var importsUsed = false;
        var curryUsed = false;
        for (var name in exports) {
            curryUsed = (
                typeof exports[name] == "function" &&
                // if it is Java class this will throw an exception, which is terribly annoying during debugging
                Object.prototype.toString.call(exports[name]) !== "[object JavaClass]" &&
                exports[name].xNarwhalCurry
            );

            if (curryUsed) {
                importsUsed = true;
                imports[name] = (function (block, module) {
                    return function () {
                        return block.apply(
                            this,
                            [module].concat(Array.prototype.slice.call(arguments))
                        );
                    };
                })(exports[name], moduleMemo[baseId]);
            } else {
                imports[name] = exports[name];
            }
        }

        if (!importsUsed)
            imports = exports;

        return imports;

    };

    /*
    sandbox.async = function (id, baseId, pkg, basePkg, options) {
    };
    */

    sandbox.load = function (id, baseId, pkg, basePkg) {
        if (loader.resolvePkg) {
            var resolveInfo = loader.resolvePkg(id, baseId, pkg, basePkg);
            id = resolveInfo[0];
            pkg = resolveInfo[1];
        } else {
            id = loader.resolve(id, baseId);
        }
        return loader.load(id);
    };

    sandbox.once = function (id, baseId, pkg, basePkg, scope) {
        return sandbox(id, baseId, pkg, basePkg, {"scope": scope});
    };

    /*
    sandbox.load.async = function (id, baseId, pkg, basePkg, options) {
    };
    */

    sandbox.force = function (id) {
        /*                 baseId,    pkgId,     basePkg  , options */
        return sandbox(id, undefined, undefined, undefined, {"force": true});
    };

    sandbox.main = function (id, path) {
        if (!path && sandbox.loader.find)
            path = sandbox.loader.find(id)[1];
        id = sandbox.loader.resolve(id, "");
        main = sandbox.main = moduleMemo[id] = moduleMemo[id] || Module(id, path);
        sandbox(id);
        return main;
    };

    sandbox.loader = loader;
    sandbox.system = system;
    sandbox.paths = loader.paths;
    sandbox.extensions = loader.extensions;
    sandbox.debug = debug;

    var Require = function (baseId, basePkg) {
        // variations of require.* functions that close on a
        // particular [package/]module
        var require = function (id, pkg) {
            return sandbox(id, baseId, pkg, basePkg);
        };
        require.async = function (id, pkg) {
            return sandbox.async(id, baseId, pkg, basePkg);
        };
        require.once = function (id, scope) {
            return sandbox.once(id, baseId, undefined, undefined, scope);
        };
        require.once.async = function (id, scope) {
            return sandbox.once.async(id, baseId, undefined, undefined, scope);
        };
        require.load = function (id, pkg) {
            return sandbox.load(id, baseId, pkg, basePkg);
        };
        require.load.async = function (id, pkg) {
            return sandbox.load.async(id, baseId, pkg, basePkg);
        };
        require.force = function (id) {
            return sandbox.force(id, baseId);
        };
        require.loader = loader;
        require.main = main;
        require.paths = loader.paths;
        require.extensions = loader.extensions;
        return require;
    };

    var Load = function (baseId, basePkg) {
        var load = function (id, pkg) {
            return sandbox.load(id, baseId, pkg, basePkg);
        };
        load.async = function (id) {
            return sandbox.load.async(id, baseId, pkg, basePkg);
        };
        return load;
    };

    var Module = function (baseId, path) {
        var module = {};
        module.id = baseId;
        module.path = path;
        module.toString = function () {
            return baseId;
        };
        module.xNarwhalCurry = function (block) {
            block.xNarwhalCurry = true;
            return block;
        };
        module.setExports = function (exports) {
            return exportsMemo[baseId] = exports;
        };
        return module;
    };

    return sandbox;
};

exports.sandbox = function(main, system, options) {
    options = options || {};
    var prefix = options['prefix'];
    var loader = options['loader'] || require.loader;
    var modules = options['modules'] || {};
    var print = options['print'];
    var debug = options['debug'];
    if (!loader) throw new Error(
        "sandbox cannot operate without a loader, either explicitly " +
        "provided as an option, or implicitly provided by the current " +
        "sandbox's 'loader' object."
    );
    if (prefix)
        loader = require("narwhal/loader/prefix").PrefixLoader(prefix, loader);
    var sandbox = exports.Sandbox({
        modules: modules,
        loader: loader,
        system: system,
        print: print,
        debug: debug
    });

    return sandbox.main(main);
};

