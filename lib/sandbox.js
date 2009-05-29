
var Loader = exports.Loader = function (options) {
    var loader = {};
    var factories = options.factories || {};
    var paths = options.paths;
    var extensions = options.extensions || ["", ".js"];
    var timestamps = {};

    loader.resolve = function (id, baseId) {
        if (typeof id != "string")
            throw new Error("module id '" + id + "' is not a String");
        if (id.charAt(0) == ".") {
            id = dirname(baseId) + "/" + id;
        }
        return loader.normalize(id);
    };

    loader.normalize = function (id) {
        return canonicalize(id);
    };

    loader.find = function (canonical) {
        for (var j = 0; j < extensions.length; j++) {
            var ext = extensions[j];
            for (var i = 0; i < paths.length; i++) {
                var fileName = join(paths[i], canonical + ext);
                if (system.fs.isFile(fileName))
                    return fileName;
            }
        }
        throw new Error("require error: couldn't find \"" + canonical + '"');
    };

    loader.fetch = function (canonical) {
        var filePath = loader.find(canonical);
        if (typeof system.fs.mtime === "function")
            timestamps[filePath] = system.fs.mtime(filePath);
        var text = system.fs.read(filePath, {
            'charset': 'utf-8'
        });
        // we leave the endline so the error line numbers align
        text = text.replace(/^#[^\n]+\n/, "\n");
        return text;
    };

    loader.evaluate = function (text, canonical) {
        if (system.evaluate) {
            var fileName = loader.find(canonical);
            var factory = system.evaluate(text, fileName, 1);
            factory.fileName = fileName;
            return factory;
        } else {
            return new Function("require", "exports", "system", "print", text);
        }
    };

    loader.load = function (canonical) {
        if (!Object.prototype.hasOwnProperty.call(factories, canonical)) {
            loader.reload(canonical);
        } else if (typeof system.fs.mtime === "function") {
            var filePath = loader.find(canonical);
            if (!Object.prototype.hasOwnProperty.call(timestamps, filePath) ||
                    system.fs.mtime(filePath) > timestamps[filePath])
                loader.reload(canonical);
        }
        return factories[canonical];
    };

    loader.reload = function (canonical) {
        factories[canonical] = loader.evaluate(loader.fetch(canonical), canonical);
    };

    loader.isLoaded = function (canonical) {
        return Object.prototype.hasOwnProperty.call(factories, canonical);
    };

    loader.paths = paths;
    loader.extensions = extensions;

    return loader;
};

exports.Sandbox = function (options) {
    options = options || {};
    var loader = options.loader;
    var sandboxSystem = options.system || system;
    var modules = options.modules || {};
    var debug = options.debug !== undefined ? options.debug === true : system.debug;

    var debugDepth = 0;
    var mainId;

    // managed print free variable in the sandbox forwards
    // to system.print
    var print = function () {
        return sandboxSystem.print.apply(sandboxSystem, arguments);
    };

    var sandbox = function (id, baseId, force, reload) {
        id = loader.resolve(id, baseId);

        if (baseId === undefined)
            mainId = id;

        /* populate memo with module instance */
        if (!Object.prototype.hasOwnProperty.call(modules, id) || force) {

            if (sandbox.debug) {
                debugDepth++;
                var debugAcc = "";
                for (var i = 0; i < debugDepth; i++) debugAcc += "+";
                system.print(debugAcc + " " + id, 'module');
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
            var require = Require(id, factory.fileName);
            factory(require, exports, sandboxSystem, print);

            if (sandbox.debug) {
                // check for new globals
                for (var name in global)
                    if (!globals[name])
                        system.log.warn("NEW GLOBAL: " + name);
            }
        
            if (sandbox.debug) {
                var debugAcc = "";
                for (var i = 0; i < debugDepth; i++) debugAcc += "-";
                system.print(debugAcc + " " + id, 'module');
                debugDepth--;
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

    var Require = function (baseId, fileName) {
        var require = function (id) {
            //try {
                return sandbox(id, baseId);
            //} catch (exception) {
            //    if (exception.message)
            //        exception.message += ' in ' + baseId;
            //    throw exception;
            //}
        };
        require.id = baseId;
        require.loader = loader;
        require.fileName = fileName;
        require.main = mainId;
        require.paths = loader.paths;
        require.extensions = loader.extensions;
        /* offers a facility to request the module id
         * in which a function was imported */
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

    sandbox.loader = loader;
    sandbox.system = system;
    sandbox.paths = loader.paths;
    sandbox.extensions = loader.extensions;

    return sandbox;
};

exports.PrefixLoader = function (prefix, loader) {
    var self = this || {};

    self.resolve = function (id, baseId) {
        return loader.resolve(id, baseId);
    };

    /**** evaluate
    */
    self.evaluate = function (text, canonicalId) {
        return loader.evaluate(text, prefix + canonicalId);
    };

    /**** fetch
    */
    self.fetch = function (canonicalId) {
        return loader.fetch(prefix + canonicalId);
    };

    /**** load
    */
    self.load = function (canonicalId) {
        return loader.load(prefix + canonicalId);
    };

    return self;
};

exports.sandbox = function(main, system, options) {
    options = options || {};
    var prefix = options['prefix'];
    var loader = options['loader'] || require.loader;
    var modules = options['modules'] || {};
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
        debug: debug
    });
    return sandbox(main);
};



////////////////////////////////////////////////
// Ugh, these are duplicated from the File object, since they're required for 
// require, which is required for loading the File object.
var dirname = function(path) {
    var raw = String(path),
        match = raw.match(/^(.*)\/[^\/]+\/?$/);
    if (match && match[1])
        return match[1]
    else if (raw.charAt(0) == "/")
        return "/"
    else
        return "."
};

var canonicalize = function(path) {
    var original;

    do {
        original = path;
        path = path
            .replace(/[^\/]+\/\.\.\//g, "")
            .replace(/([^\.])\.\//g, "$1")
            .replace(/^\.\//g, "")
            .replace(/\/\/+/g, "/");
    } while (path !== original);
        
    return path;
};

var join = function (base) {
    for (var i = 1; i < arguments.length; i++) {
        var rel = arguments[i];
        if (rel.match(/^\//)) {
            base = rel;
        } else {
            base = base + '/' + rel;
        }
    }
    return canonicalize(base);
};
////////////////////////////////////////////////
