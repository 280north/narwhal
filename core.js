// This file contains some basic features that *should* be provided by a standard library

__global__ = this;

(function() {

$DEBUG = true;
$WARN = true;

if (typeof Packages !== "undefined" && Packages && Packages.java)
    __platform__ = "rhino";
//else if (typeof File !== "undefined")
// __platform__ = "v8cgi";
else
    __platform__ = "default";

// Securable Modules compatible "require" method
// https://wiki.mozilla.org/ServerJS/Modules/SecurableModules

require = function(name) {
    return _require(name, ".", true);
}

require.paths       = [".","lib"];
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
            extensions = (/\.\w+$/).test(name) ? [""] : require.extensions;
        for (var j = 0; j < extensions.length; j++)
        {
            var ext = extensions[j];
            for (var i = 0; i < require.paths.length; i++)
            {
                var searchDirectory = (require.paths[i] === ".") ? pwd : require.paths[i],
                    path = searchDirectory + "/" + name + ext;
                    
                var result = _attemptLoad(name, path, loadOnce);
                if (result)
                    return result;
            }
        }
    }
    
    log.warn("couldn't find " + name);
    
    if ($DEBUG)
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
    
    //log.debug(" + attemptLoad: " + path +" ("+name+")");
    
    // see if the module is already loaded
    if (require.loaded[path] && loadOnce)
    {
        //log.debug(" + already loaded: " + name + " => " + path);
        return require.loaded[path];
    }
    
    // FIXME: replace with the real File object
    // some interpreters throw exceptions.
    try { moduleCode = readFile(path); } catch (e) {}
    
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
// Ugh, these are duplicated from the File object, since they're required for require, which is required for loading the File object.
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

// Built in object additions.

// TODO: move/remove these?

// Array additions

if (typeof Array.prototype.forEach !== "function")
    Array.prototype.forEach =  function(block) { for (var i = 0; i < this.length; i++) block(this[i]); };

isArray = function(obj) { return obj && typeof obj === "object" && obj.constructor === Array; }


// String additions

String.prototype.forEach = function(block, separator) {
    block(String(this)); // RHINO bug: it thinks "this" is a Java string (?!)
    
    //if (!separator)
    //    separator = /\n+/;
    //
    //this.split(separator).forEach(block);
}

String.prototype.squeeze = function() {
    var set = arguments.length > 0 ? "["+Array.prototype.join.apply(arguments, ["]|["])+"]" : ".|\\n",
        regex = new RegExp("("+set+")\\1+", "g");
    
    return this.replace(regex, "$1");
}

String.prototype.chomp = function(separator) {
    var extra = separator ? separator + "|" : "";
    return this.replace(new RegExp("("+extra+"\\r|\\n|\\r\\n)*$"), "");
}

// RegExp

RegExp.escape = function(string) {
    return string.replace(/([\/\\^$*+?.():=!|{},[\]])/g, "\\$1");
}


// Logging

// TODO: move this to a logger class?

var _logger = function(object, level) {
    var string = "[" + (level || "log") + "] " + object;
    
    if (typeof STDERR !== "undefined")
        STDERR.puts(string);
    else if (typeof print !== "undefined")
        print(string);
}

log = {
    warn : function(string) {
        if ($WARN)
            _logger(string, "warn");
    },
    debug : function(string) {
        if ($DEBUG)
            _logger(string, "debug");
    }
};

// Interpreter specific code:

// readFile is used by require. Attempt to define it if it's not already.
if (typeof readFile === "undefined") {
    // Ruby
    if (typeof Ruby !== "undefined") {
        readFile = function(path) {
            try {
                if (Ruby.File["readable?"](path))
                    return String(Ruby.File.read(path));
            } catch (e) {}
            return "";
        }
    }
    // v8cgi
    else if (typeof File !== "undefined") {
        readFile = function(path) {
            var result = "",
                f = new File(path);
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
}

var platform = require("platform");

ARGV    = platform.ARGV;
ENV     = platform.ENV;
STDOUT  = platform.STDOUT;
STDERR  = platform.STDERR;
STDIN   = platform.STDIN;

// TODO: eventually remove some or all of these?

IO      = require("io").IO;
File    = require("file").File;
Hash    = require("hash").Hash;
HashP   = require("hashP").HashP;

})();
