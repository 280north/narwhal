
// NOTE: this file is used is the bootstrapping process,
// so any "requires" must be accounted for in narwhal.js

var system = require("system");

exports.Loader = function (options) {
    var loader = {};
    var factories = options.factories || {};
    var paths = options.paths;
    var extensions = options.extensions || ["", ".js"];
    var timestamps = {};
    var debug = options.debug;

    loader.resolve = exports.resolve;

    loader.find = function (topId) {
        // if it's absolute only search the "root" directory.
        // file.join() must collapse multiple "/" into a single "/"
        var searchPaths = system.fs.isAbsolute(topId) ? [""] : paths;
        
        for (var j = 0; j < extensions.length; j++) {
            var extension = extensions[j];
            for (var i = 0; i < searchPaths.length; i++) {
                var path = system.fs.join(searchPaths[i], topId + extension);
                if (system.fs.isFile(path))
                    return path;
            }
        }
        throw new Error("require error: couldn't find \"" + topId + '"');
    };

    loader.fetch = function (topId, path) {
        if (!path)
            path = loader.find(topId);
        if (typeof system.fs.mtime === "function")
            timestamps[path] = system.fs.mtime(path);
        if (debug)
            print('loader: fetching ' + topId);
        var text = system.fs.read(path, {
            'charset': 'utf-8'
        });
        // we leave the endline so the error line numbers align
        text = text.replace(/^#[^\n]+\n/, "\n");
        return text;
    };

    loader.evaluate = function (text, topId) {
        if (system.evaluate) {
            var fileName = loader.find(topId);
            var factory = system.evaluate(text, fileName, 1);
            factory.path = fileName;
            return factory;
        } else {
            return new Function("require", "exports", "module", "system", "print", text);
        }
    };

    loader.load = function (topId) {
        if (!Object.prototype.hasOwnProperty.call(factories, topId)) {
            loader.reload(topId);
        } else if (typeof system.fs.mtime === "function") {
            var path = loader.find(topId);
            if (loader.hasChanged(topId, path))
                loader.reload(topId);
        }
        return factories[topId];
    };

    loader.reload = function (topId, path) {
        factories[topId] = loader.evaluate(loader.fetch(topId, path), topId);
    };

    loader.isLoaded = function (topId) {
        return Object.prototype.hasOwnProperty.call(factories, topId);
    };

    loader.hasChanged = function (topId, path) {
        if (!path)
            path = loader.resolve(topId);
        return (
            !Object.prototype.hasOwnProperty.call(timestamps, path) ||
            system.fs.mtime(path) > timestamps[path]
        );
    };

    loader.paths = paths;
    loader.extensions = extensions;

    return loader;
};

exports.MultiLoader = function (options) {

    var factories = options.factories || {};

    var self = {};
    self.paths = options.paths || [];
    self.loader = options.loader || exports.Loader(options);
    self.loaders = options.loaders || [
        ["", self.loader],
        [".js", self.loader]
    ];

    self.resolve = exports.resolve;

    self.find = function (topId) {
        // if it's absolute only search the "root" directory.
        // file.join() must collapse multiple "/" into a single "/"
        var searchPaths = system.fs.isAbsolute(topId) ? [""] :  self.paths;
        
        for (var j = 0; j < self.loaders.length; j++) {
            var extension = self.loaders[j][0];
            var loader = self.loaders[j][1];
            for (var i = 0; i < searchPaths.length; i++) {
                var path = system.fs.join(searchPaths[i], topId + extension);
                if (system.fs.isFile(path)) {
                    // now check each extension for a match.
                    // handles case when extension is in the id, so it's matched by "",
                    // but we want to use the loader corresponding to the actual extension
                    for (var k = 0; k < self.loaders.length; k++) {
                        var ext = self.loaders[k][0];
                        if (path.lastIndexOf(ext) === path.length - ext.length)
                            return [self.loaders[k][1], path];
                    }
                    throw "ERROR: shouldn't reach this point!"
                }
            }
        }
        throw "require error: couldn't find \"" + topId + '"';
    };

    self.load = function (topId, loader, path) {
        if (!loader || !path) {
            var pair = self.find(topId);
            loader = pair[0];
            path = pair[1];
        }
        if (
            !Object.prototype.hasOwnProperty.call(factories, topId) ||
            (loader.hasChanged && loader.hasChanged(topId, path))
        )
            self.reload(topId, loader, path);
        return factories[topId];
    };

    self.reload = function (topId, loader, path) {
        if (!loader || !path) {
            var pair = self.find(topId);
            loader = pair[0];
            path = pair[1];
        }
        loader.reload(topId, path);
        factories[topId] = loader.load(topId, path);
    };

    self.isLoaded = function (topId) {
        return Object.prototype.hasOwnProperty.call(factories, topId);
    };

    return self;
};

exports.AttenuatedLoader = function (loader) {
    var self = {};

    self.resolve = Object.freeze(function (id, baseId) {
        return loader.resolve(id, baseId);
    });

    self.fetch = Object.freeze(function (topId) {
        if (/\./.test(topId))
            throw new Error("Invalid module identifier");
        return loader.fetch(topId);
    });

    self.load = Object.freeze(function (topId, path) {
        if (/\./.test(topId))
            throw new Error("Invalid module identifier");
        return loader.load(topId, path);
    });

    self.reload = Object.freeze(function (topId) {
        if (/\./.test(topId))
            throw new Error("Invalid module identifier");
        return loader.reload(topId, path);
    });

    return Object.freeze(self);
};

exports.Sandbox = function (options) {
    options = options || {};
    var loader = options.loader;
    var subsystem = options.system || system || {};
    var modules = options.modules || {};
    var debug = options.debug !== undefined ? !!options.debug : !!system.debug;

    // managed print free variable in the sandbox forwards
    // to system.print in the sandbox
    var subprint = options.print || function () {
        return subsystem.print.apply(subsystem, arguments);
    };

    var debugDepth = 0;
    var mainId;

    var sandbox = function (id, baseId, force, reload) {
        id = loader.resolve(id, baseId);

        /* populate memo with module instance */
        if (!Object.prototype.hasOwnProperty.call(modules, id) || force) {

            if (sandbox.debug) {
                debugDepth++;
                var debugAcc = "";
                for (var i = 0; i < debugDepth; i++) debugAcc += "\\";
                print(debugAcc + " " + id, 'module');
            }

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

            var factory = null;
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
            var require = Require(id, factory.path);
            var module = {
                'id': id,
                'path': factory.path
            };
            factory(require, exports, module, subsystem, subprint);

            if (sandbox.debug) {
                // check for new globals
                for (var name in global)
                    if (!globals[name])
                        system.log.warn("NEW GLOBAL: " + name);
            }
        
            if (sandbox.debug) {
                var debugAcc = "";
                for (var i = 0; i < debugDepth; i++) debugAcc += "/";
                print(debugAcc + " " + id, 'module');
                debugDepth--;
            }

        } else {
            if (sandbox.debug) {
                var debugAcc = "";
                for (var i = 0; i < debugDepth; i++) debugAcc += "|";
                print(debugAcc + "  " + id, 'module');
            }
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

    var Require = function (baseId, fileName) { // XXX deprecated fileName
        var require = function (id) {
            //try {
                return sandbox(id, baseId);
            //} catch (exception) {
            //    if (exception.message)
            //        exception.message += ' in ' + baseId;
            //    throw exception;
            //}
        };
        require.loader = loader;
        require.main = mainId;
        require.paths = loader.paths;
        require.extensions = loader.extensions;
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
        return sandbox(id, '', true);
    };

    sandbox.main = function (id) {
        mainId = id;
        return sandbox(id);
    };

    sandbox.loader = loader;
    sandbox.system = system;
    sandbox.paths = loader.paths;
    sandbox.extensions = loader.extensions;
    sandbox.debug = debug;

    return sandbox;
};

exports.PrefixLoader = function (prefix, loader) {
    var self = this || {};

    self.resolve = function (id, baseId) {
        return loader.resolve(id, baseId);
    };

    /**** evaluate
    */
    self.evaluate = function (text, topId) {
        return loader.evaluate(text, prefix + topId);
    };

    /**** fetch
    */
    self.fetch = function (topId) {
        return loader.fetch(prefix + topId);
    };

    /**** load
    */
    self.load = function (topId) {
        return loader.load(prefix + topId);
    };

    return self;
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
        loader = exports.PrefixLoader(prefix, loader);
    var sandbox = exports.Sandbox({
        modules: modules,
        loader: loader,
        system: system,
        print: print,
        debug: debug
    });
    return sandbox.main(main);
};

exports.resolve = function (id, baseId) {
    if (typeof id != "string")
        throw new Error("module id '" + id + "' is not a String");
    if (id.charAt(0) == ".") {
        id = system.fs.dirname(baseId) + "/" + id;
    }
    return system.fs.normal(id);
};

