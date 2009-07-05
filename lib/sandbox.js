
exports.Loader = function (options) {
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
        return normal(id);
    };

    loader.find = function (topId) {
        for (var j = 0; j < extensions.length; j++) {
            var ext = extensions[j];
            for (var i = 0; i < paths.length; i++) {
                var fileName = join(paths[i], topId + ext);
                if (system.fs.isFile(fileName))
                    return fileName;
            }
        }
        throw new Error("require error: couldn't find \"" + topId + '"');
    };

    loader.fetch = function (topId, path) {
        if (!path)
            path = loader.find(topId);
        if (typeof system.fs.mtime === "function")
            timestamps[path] = system.fs.mtime(path);
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
            var filePath = loader.find(topId);
            if (!Object.prototype.hasOwnProperty.call(timestamps, filePath) ||
                    system.fs.mtime(filePath) > timestamps[filePath])
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

    self.resolve = function (id, baseId) {
        if (typeof id != "string")
            throw new Error("module id '" + id + "' is not a String");
        if (id.charAt(0) == ".") {
            id = dirname(baseId) + "/" + id;
        }
        return normal(id);
    };

    self.find = function (topId) {
        for (var j = 0; j < self.loaders.length; j++) {
            var pair = self.loaders[j];
            var extension = pair[0];
            var loader = pair[1];
            for (var i = 0; i < self.paths.length; i++) {
                var path = join(self.paths[i], topId + extension);
                if (system.fs.isFile(path)) {
                    return [loader, path];
                }
            }
        }
        throw "require error: couldn't find \"" + topId + '"';
    };

    self.load = function (topId) {
        if (!Object.prototype.hasOwnProperty.call(factories, topId))
            self.reload(topId);
        return factories[topId];
    };

    self.reload = function (topId) {
        var pair = self.find(topId);
        var loader = pair[0];
        var path = pair[1];
        loader.reload(topId, path);
        factories[topId] = loader.load(topId, path);
    };

    self.isLoaded = function (topId) {
        return Object.prototype.hasOwnProperty.call(factories, topId);
    };


    return self;
};

exports.Sandbox = function (options) {
    options = options || {};
    var loader = options.loader;
    var sandboxSystem = options.system || system;
    var modules = options.modules || {};
    var debug = options.debug !== undefined ? !!options.debug : system.debug;

    var debugDepth = 0;
    var mainId;

    // managed print free variable in the sandbox forwards
    // to system.print
    var print = function () {
        return sandboxSystem.print.apply(sandboxSystem, arguments);
    };

    var sandbox = function (id, baseId, force, reload) {
        id = loader.resolve(id, baseId);

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
            var require = Require(id, factory.path);
            var module = {
                'id': id,
                'path': factory.path
            };
            factory(require, exports, module, sandboxSystem, print);

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
        require.id = baseId; // XXX deprecated
        require.loader = loader;
        require.fileName = fileName; // XXX deprecated
        require.main = mainId; // XXX deprecated
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
    return sandbox.main(main);
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

var normal = function(path) {
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
    return normal(base);
};
////////////////////////////////////////////////
