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

// logger shim until it's loaded
var shim = function () {
    if (system.debug && system.print) {
        system.print(Array.prototype.join.apply(arguments, [" "]));
    }
};
var log = {fatal:shim, error:shim, warn:shim, info:shim, debug:shim};
system.log = log;

/* the narwhal installation prefix */
var prefix = fixtures.prefix;

var Loader = function (options) {
    var loader = {};
    var factories = options.factories || {};
    var paths = options.paths || (
        typeof fixtures.path === "string" ?
        fixtures.path.split(":") : ["lib"]
    );
    var extensions = options.extensions || ["", ".js"];

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

    loader.fetch = function (canonical) {
        for (var j = 0; j < extensions.length; j++)
        {
            var ext = extensions[j];
            for (var i = 0; i < paths.length; i++)
            {
                var fileName = join(paths[i], canonical + ext);
                try {
                    var text = fixtures.read(fileName);
                    // remove the shebang, if there is one.
                    text = text.replace(/^#[^\n]+\n/, "\n");
                    return text;
                } catch (exception) {
                    // next!
                }
            }
        }
        throw new Error("require error: couldn't find \"" + canonical + '"');
    };

    loader.evaluate = function (text, canonical) {
        if (fixtures.evaluate) {
            return fixtures.evaluate(text, canonical, 1);
        } else {
            return new Function("require", "exports", "system", text);
        }
    };

    loader.load = function (canonical) {
        if (!Object.prototype.hasOwnProperty.call(factories, canonical)) {
            factories[canonical] = loader.evaluate(loader.fetch(canonical), canonical);
        }
        return factories[canonical];
    };

    loader.isLoaded = function (canonical) {
        return Object.prototype.hasOwnProperty.call(factories, canonical);
    };

    loader.getPaths = function () {
        return Array.prototype.slice.call(paths);
    };

    loader.setPaths = function (_paths) {
        paths = Array.prototype.slice.call(_paths);
    };

    loader.getExtensions = function () {
        return Array.prototype.slice.call(extensions);
    };

    loader.setExtensions = function (_extensions) {
        extensions = Array.prototype.slice.call(_extensions);
    };

    return loader;
};

var Sandbox = function (options) {
    options = options || {};
    var loader = options.loader;
    var sandboxSystem = options.system || system;
    var modules = options.modules || {};
    var debug = options.debug !== undefined ? options.debug === true : system.debug;

    var debugDepth = 0;
    var mainId;

    var sandbox = function (id, baseId) {
        id = loader.resolve(id, baseId);

        system.log.debug("require: " + id + " (parent="+baseId+")");

        if (baseId === undefined)
            mainId = id;

        /* populate memo with module instance */
        if (!Object.prototype.hasOwnProperty.call(modules, id)) {

            if (system.debug) {
                debugDepth++;
                var debugAcc = "";
                for (var i = 0; i < debugDepth; i++) debugAcc += "+";
                system.print(debugAcc + " " + id, 'module');
            }

            var globals = {};
            if (system.debug) {
                // record globals
                for (var name in global)
                    globals[name] = true;
            }
            
            var exports = modules[id] = {};
            var factory = loader.load(id);
            var require = Require(id);
            factory(require, exports, sandboxSystem);

            if (system.debug) {
                // check for new globals
                for (var name in global)
                    if (!globals[name])
                        system.log.warn("NEW GLOBAL: " + name);
            }
        
            if (system.debug) {
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
        for (var name in exports) {
            if (
                exports[name] !== undefined &&
                exports[name] !== null &&
                exports[name].xNarwhalCurryId
            ) {
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

    var Require = function (baseId) {
        var require = function (id) {
            try {
                return sandbox(id, baseId);
            } catch (exception) {
                if (exception.message)
                    exception.message += ' in ' + baseId;
                throw exception;
            }
        };
        require.id = baseId;
        require.loader = loader;
        require.main = mainId;
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

    sandbox.loader = loader;
    sandbox.system = system;

    return sandbox;
};

var loader = Loader({});
global.require = Sandbox({loader: loader});

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

try {
    require("global");
} catch (e) {
    system.log.error("Couldn't load global/primordial patches ("+e+")");
}

/* populate the system free variable from the system module */
var systemModule = require('system');
for (var name in systemModule) {
    if (Object.prototype.hasOwnProperty.call(systemModule, name)) {
        system[name] = systemModule[name];
    }
}

// load packages
require("packages");

// load the program module
if (system.args.length)
    require(system.args.shift());

/* send an unload event if that module has been required */
if (require.loader.isLoaded('unload')) {
    require('unload').send();
}

})
