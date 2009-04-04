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

var sys = {};
sys.print = print;
sys.platform = __platform__;

var Loader = function (options) {
    var loader = {};
    var factories = options.factories || {};
    var paths = options.paths || (
        typeof $LOAD_PATH === "string" ?
        $LOAD_PATH.split(":") : ["lib"]
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
        var text;
        // FIXME: replace with the real File object
        // some interpreters throw exceptions.
        for (var j = 0; j < extensions.length; j++)
        {
            var ext = extensions[j];
            for (var i = 0; i < paths.length; i++)
            {
                var fileName = join(paths[i], canonical + ext);
                text = undefined;
                try { text = _readFile(fileName); } catch (exception) {}
                // remove the shebang, if there is one.
                if (!!text) {
                    text = text.replace(/^#[^\n]+\n/, "\n");
                    return text;
                }
            }
        }
        throw new Error("require error: couldn't find \"" + canonical + '"');
    };

    loader.evaluate = function (text, canonical) {
        if (typeof Packages !== "undefined" && Packages.java)
            return Packages.org.mozilla.javascript.Context.getCurrentContext().compileFunction(
                __global__,
                "function(require,exports,sys){"+text+"}",
                canonical,
                1,
                null
            );
        else
            return new Function("require", "exports", "sys", text);
    };

    loader.load = function (canonical) {
        if (!Object.prototype.hasOwnProperty.call(factories, canonical)) {
            factories[canonical] = loader.evaluate(loader.fetch(canonical), canonical);
        }
        return factories[canonical];
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
    var sandboxSys = options.sys || sys;
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
                sys.print(debugAcc + " " + id, 'module');
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
                factory(require, exports, sandboxSys);
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
                sys.print(debugAcc + " " + id, 'module');
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
    sandbox.sys = sys;

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

// load the program module
if (ARGV.length)
    require(ARGV.shift());

})();

