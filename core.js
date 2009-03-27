// global reference

__global__ = this;

// debug flag
$DEBUG = typeof $DEBUG !== "undefined" && $DEBUG;

// determine platform
if (typeof Packages !== "undefined" && Packages && Packages.java) {
    if ($DEBUG) Packages.org.mozilla.javascript.Context.getCurrentContext().setOptimizationLevel(-1);
    __platform__ = "rhino";
} else {
    __platform__ = "default";
}

// logger shim until it's loaded
log = {};
log.fatal = log.error = log.warn = log.info = log.debug = function() {
    if ($DEBUG && typeof print === "function")
        print(Array.prototype.join.apply(arguments, [" "]));
};

// Securable Modules compatible "require" method
// https://wiki.mozilla.org/ServerJS/Modules/SecurableModules
(function() {

var environment = {};
environment.print = print;
environment.platform = __platform__;

var Loader = function (options) {
    var loader = {};
    var factories = options.factories || {};
    var paths = options.paths || (
        typeof $LOAD_PATH === "string" ?
        $LOAD_PATH.split(":") : ["lib"]
    );
    var extensions = options.extensions || ["js"];

    loader.resolve = function (id, baseId) {
        if (typeof id != "string")
            throw new Error("module id '" + id + "' is not a String");
        if (id.charAt(0) == ".") {
            id = dirname(baseId) + "/" + id;
        }
        return loader.normalize(id);
    };

    loader.normalize = function (id) {
        id = id.replace("{platform}", "platforms/" + environment.platform);
        id = canonicalize(id);
        return id;
    };

    loader.fetch = function (canonical) {
        var text;
        // FIXME: replace with the real File object
        // some interpreters throw exceptions.
        for (var j = 0; j < extensions.length; j++)
        {
            var ext = extensions[j];
            for (var i = 0; i < paths.length; i++)
            {
                var fileName = paths[i] + "/" + canonical + "." + ext;
                text = undefined;
                try { text = _readFile(fileName); } catch (exception) {}
                if (!!text)
                    return text;
            }
        }
        throw new Error("require error: couldn't find \"" + canonical + '"');
    };

    loader.evaluate = function (text, canonical) {
        if (typeof Packages !== "undefined" && Packages.java)
            return Packages.org.mozilla.javascript.Context.getCurrentContext().compileFunction(
                __global__,
                "function(require,exports,environment){"+text+"}",
                canonical,
                1,
                null
            );
        else
            return new Function("require", "exports", "environment", text);
    };

    loader.load = function (canonical) {
        if (!Object.prototype.hasOwnProperty.call(factories, canonical)) {
            factories[canonical] = loader.evaluate(loader.fetch(canonical), canonical);
        }
        return factories[canonical];
    };

    loader.getPaths = function () {
        return paths; // todo copy
    };

    loader.setPaths = function (_paths) {
        paths = _paths;
    };

    loader.getExtensions = function () {
        return extensions; // todo copy
    };

    loader.setExtensions = function (_extensions) {
        extensions = _extensions;
    };

    return loader;
};

var Sandbox = function (options) {
    options = options || {};
    var loader = options.loader;
    var sandboxEnvironment = options.environment || environment;
    var modules = options.modules || {};
    var debug = options.debug !== undefined ? options.debug === true : $DEBUG;

    var debugDepth = 0;
    var mainId;

    var sandbox = function (id, baseId) {
        id = loader.resolve(id, baseId);

        log.debug("require: " + id + " (parent="+baseId+")");

        if (baseId === undefined)
            mainId = id;

        /* populate memo with module instance */
        if (!Object.prototype.hasOwnProperty.call(modules, id)) {

            if (debug) {
                debugDepth++;
                var debugAcc = "";
                for (var i = 0; i < debugDepth; i++) debugAcc += "+";
                environment.print(debugAcc + " " + id, 'module');
            }

            var globals = {};
            if (debug) {
                // record globals
                for (var name in __global__)
                    globals[name] = true;
            }
            
            try {
                var exports = modules[id] = {};
                var factory = loader.load(id);
                var require = Require(id);
                factory(require, exports, sandboxEnvironment);
            } catch (exception) {
                modules[id] = undefined;
                delete modules[id];
                throw exception;
            }

            if (debug) {
                // check for new globals
                for (var name in __global__)
                    if (!globals[name])
                        log.warn("NEW GLOBAL: " + name);
            }
        
            if (debug) {
                var debugAcc = "";
                for (var i = 0; i < debugDepth; i++) debugAcc += "-";
                environment.print(debugAcc + " " + id, 'module');
                debugDepth--;
            }

        }

        return modules[id];

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
        return require;
    };

    sandbox.loader = loader;
    sandbox.environment = environment;

    return sandbox;
};

var loader = Loader({});
require = Sandbox({loader: loader});

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

////////////////////////////////////////////////

var _readFile;
if (typeof readFile !== "undefined") {
    _readFile = readFile;
}
else {
    // v8cgi
    if (typeof File !== "undefined") {
        var _File = File;
        _readFile = function(path) {
            var result = "",
                f = new _File(path);
            try {
                if (!f.exists())
                    throw new Error();
                    
                f.open("r");
                result = f.read();
                
            } finally {
                f.close();
            }
            return result;
        }
    }
    else
        throw new Error("No readFile implementation.");
}

try {
    require("environment");
} catch(e) {
    log.error("Couldn't load environment ("+e+")");
}

})();

