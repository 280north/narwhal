
// NOTE: this file is used is the bootstrapping process,
// so any "requires" must be accounted for in narwhal.js

var system = require("system");

exports.Sandbox = function (options) {
    options = options || {};
    var loader = options.loader;
    var subsystem = options.system || system || {};
    var modules = options.modules || {};
    var metadata = {};
    var debug = options.debug !== undefined ? !!options.debug : !!system.debug;

    // managed print free variable in the sandbox forwards
    // to system.print in the sandbox
    var subprint = options.print || function () {
        return subsystem.print.apply(subsystem, arguments);
    };

    var debugDepth = 0;
    var main;

    var sandbox = function (id, baseId, pkg, basePkg, force, reload) {

        if (sandbox.debug)
            print("id["+id+"] baseId["+baseId+"] pkg["+pkg+"] basePkg["+basePkg+"]");            
                
        if(loader.resolvePkg) {
            var resolveInfo = loader.resolvePkg(id, baseId, pkg, basePkg);
            id = resolveInfo[0];
            pkg = resolveInfo[1];
        } else {
            id = loader.resolve(id, baseId);
        }

        if (sandbox.debug)
            print("  USING: id["+id+"] pkg["+pkg+"]");

        /* populate memo with module instance */
        if (!Object.prototype.hasOwnProperty.call(modules, id) || force) {

            if (sandbox.debug)
                print(new Array(++debugDepth + 1).join("\\") + " " + id, 'module');

            var globals = {};
            if (sandbox.debug) {
                // record globals
                for (var name in global)
                    globals[name] = true;
            }
            
            if (!Object.prototype.hasOwnProperty.call(modules, id) || reload)
                modules[id] = {};
            var exports = modules[id];
            if (reload)
                loader.reload(id);

            var factory;
            try {
                factory = loader.load(id);
            } finally {
                // poor man's catch and rethrow (Rhino sets file/line to where the exception is thrown, not created)
                if (!factory) {
                    delete modules[id];
                    if (sandbox.debug)
                        debugDepth--;
                }
            }

            var require = Require(id, pkg);
            var module = metadata[id] = metadata[id] || {};
            module.id = id;
            module.path = factory.path;
            if (pkg) {
                module["package"] = pkg;
                module.using = (
                    pkg && loader.usingCatalog && loader.usingCatalog[pkg] ?
                    loader.usingCatalog[pkg]["packages"] :
                    {}
                );
            }
            module.toString = function () {
                return this.id;
            };

            // this shim supports both the old factory(r, e, m, s, p) and
            // new factory(inject) module constructor conventions
            var inject = require;
            inject.require = require;
            inject.exports = exports;
            inject.module = module;
            inject.system = subsystem;
            inject.print = subprint;
            factory(inject, exports, module, subsystem, subprint);

            /*
            // XXX to be uncommented when the above shim is
            // no longer needed for migration
            factory({
                "require": require,
                "exports": exports,
                "module": module,
                "system": subsystem,
                "print": subprint
            });
            */

            if (sandbox.debug) {
                // check for new globals
                for (var name in global)
                    if (!globals[name])
                        system.print("NEW GLOBAL: " + name);
            }
        
            if (sandbox.debug)
                print(new Array(debugDepth-- + 1).join("/") + " " + id, 'module');

        } else {
            if (sandbox.debug > 1)
                print(new Array(debugDepth + 1).join("|") + " " + id, 'module');
        }

        /* support curryId for modules in which it is requested */
        var exports = modules[id];
        var imports = {};
        var importsUsed = false;
        var curryUsed = false;
        for (var name in exports) {
            try {
                // This try/catch block is needed to handle wrapped Java
                // objects in Rhino.
                curryUsed = (
                    typeof exports[name] == "function" &&
                    exports[name].xNarwhalCurryId
                );
            } catch (exception) {};
            
            if (curryUsed) { 
                importsUsed = true;
                imports[name] = (function (callback) {
                    var curried = function () {
                        return callback.apply(
                            this,
                            [baseId].concat(Array.prototype.slice.call(arguments, 0))
                        );
                    };
                    curried.xNarwhalCurryId = callback;
                    return curried;
                })(exports[name].xNarwhalCurryId);
            } else {
                imports[name] = exports[name];
            }
        }

        if (!importsUsed)
            imports = exports;

        return imports;

    };

    var Require = function (baseId, basePkg) {
        var require = function (id, pkg) {
            //try {
                return sandbox(id, baseId, pkg, basePkg);
            //} catch (exception) {
            //    if (exception.message)
            //        exception.message += ' in ' + baseId;
            //    throw exception;
            //}
        };
        require.loader = loader;
        require.main = main;
        require.paths = loader.paths;
        require.extensions = loader.extensions;
        require.async = sandbox.async;
        /* offers a facility to request the module id
         * in which a function was imported */
        // XXX deprecated (will need to be moved to module object)
        require.xNarwhalCurryId = function (callback) {
            var curried = function () {
                return callback.apply(
                    this,
                    [baseId].concat(Array.prototype.slice.call(arguments))
                );
            };
            curried.curryId = callback;
            return curried;
        };
        return require;
    };

    sandbox.force = function (id) {
        /*                 baseId,    pkgId,     basePkg        */
        return sandbox(id, undefined, undefined, undefined, true);
    };

    sandbox.main = function (id) {
        main = sandbox.main = metadata[id] = metadata[id] || {};
        sandbox(id);
        return main;
    };

    sandbox.loader = loader;
    sandbox.system = system;
    sandbox.paths = loader.paths;
    sandbox.extensions = loader.extensions;
    sandbox.debug = debug;

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
        loader = require("loader/prefix").PrefixLoader(prefix, loader);
    var sandbox = exports.Sandbox({
        modules: modules,
        loader: loader,
        system: system,
        print: print,
        debug: debug
    });

    return sandbox.main(main);
};

