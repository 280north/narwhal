// global reference
__global__ = this;

// debug flag
if (typeof $DEBUG === "undefined")
    $DEBUG = false;

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

require = function(name) {
    return _require(name, ".", true);
}

requireForce = function(name) {
    return _require(name, ".", false);
}

require.paths       = (typeof $LOAD_PATH === "string") ? $LOAD_PATH.split(":") : ["lib"];
require.loaded      = {};
require.extensions  = [".js"];

function _require(name, parentPath, loadOnce) {
    log.debug(" + _require: " + name + " (parent="+parentPath+", loadOnce="+loadOnce+")");
    var name = name.replace("{platform}", "platforms/" + __platform__);
    
    if (name.charAt(0) === "/")
    {
        var result = _attemptLoad(name, name, loadOnce);
        if (result)
            return result;
    }
    else
    {
        var pwd = dirname(parentPath),
            extensions = (/\.\w+$/).test(name) ? [""] : require.extensions,
            paths = ["."].concat(require.paths);
        for (var j = 0; j < extensions.length; j++)
        {
            var ext = extensions[j];
            for (var i = 0; i < paths.length; i++)
            {
                var searchDirectory = (paths[i] === ".") ? pwd : paths[i],
                    path = searchDirectory + "/" + name + ext;
                var result = _attemptLoad(name, path, loadOnce);
                if (result)
                    return result;
            }
        }
    }
    
    log.debug("couldn't find " + name);
    
    //if ($DEBUG)
        throw new Error("couldn't find " + name); // make this the default behavior pending Securable Modules decision
    
    return undefined;
}

function _requireFactory(path, loadOnce) {
    return function(name) {
        return _require(name, path, loadOnce || false);
    }
}

function _attemptLoad(name, path, loadOnce) {
    var path = canonicalize(path),
        moduleCode;
        
    // see if the module is already loaded
    if (require.loaded[path] && loadOnce)
        return require.loaded[path];
    
    // FIXME: replace with the real File object
    // some interpreters throw exceptions.
    try { moduleCode = _readFile(path); } catch (e) {}
    
    if (moduleCode)
    {
        log.debug(" + loading: " + path + " (" + name + ")");
        
        require.loaded[path] = {};
        
        var globals = {};
        if ($DEBUG) {
            // record globals
            for (var name in __global__)
                globals[name] = true;
        }
        
        var module;
        if (typeof Packages !== "undefined" && Packages.java)
            module = Packages.org.mozilla.javascript.Context.getCurrentContext().compileFunction(__global__, "function(require,exports){"+moduleCode+"}", path, 0, null);
        else
            module = new Function("require", "exports", moduleCode)
        
        module(_requireFactory(path, true), require.loaded[path]);
        
        if ($DEBUG) {
            // check for new globals
            for (var name in __global__)
                if (!globals[name])
                    log.warn("NEW GLOBAL: " + name);
        }
        
        return require.loaded[path];
    }
    return false;
}


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
}
var canonicalize = function(path) {
    return path.replace(/[^\/]+\/\.\.\//g, "").replace(/([^\.])\.\//g, "$1").replace(/^\.\//g, "").replace(/\/\/+/g, "/");
}
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

})();

try {
    require("environment");
} catch(e) {
    log.error("Couldn't load environment ("+e+")");
}
