// This file contains some basic features that *should* be provided by a standard library

(function(__global__) {

var debug = true;

// Securable Modules compatible "require" method
// https://wiki.mozilla.org/ServerJS/Modules/SecurableModules

require = function(name) {
    return _require(name, ".", true);
}

require.paths       = ["."];
require.loaded      = {};
require.extensions  = [".js"];

function _require(name, parentPath, loadOnce) {
    //log.debug(" + _require: " + name + " (parent="+parentPath+", loadOnce="+loadOnce+")");
    
    if (name.charAt(0) === "/")
    {
        var result = _attemptLoad(name, name, loadOnce);
        if (result)
            return result;
    }
    else
    {
        var pwd = File.dirname(parentPath),
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
    
    log.error("couldn't find " + name);
    
    if (debug)
        throw new Error("couldn't find " + name); // make this the default behavior pending Securable Modules decision
    
    return undefined;
}


function _requireFactory(path, loadOnce) {
    return function(name) {
        return _require(name, path, loadOnce || false);
    }
}

function _attemptLoad(name, path, loadOnce) {
    var path = File.canonicalize(path),
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
        if (debug) {
            // record globals
            for (var name in __global__)
                globals[name] = true;
        }
        
        var module = new Function("require", "exports", moduleCode)
        module(_requireFactory(path, true), require.loaded[path]);
        
        if (debug) {
            // check for new globals
            for (var name in __global__)
                if (!globals[name])
                    log.error("NEW GLOBAL: " + name);
        }
        
        return require.loaded[path];
    }
    return false;
}

if (typeof File === "undefined")
    File = {};

File.SEPARATOR = "/";
File.dirname = function(path) {
    var raw = String(path),
        match = raw.match(/^(.*)\/[^\/]+\/?$/);
    if (match && match[1])
        return match[1]
    else if (raw.charAt(0) == "/")
        return "/"
    else
        return "."
}
File.extname = function(path) {
    var index = path.lastIndexOf(".");
    return index < 0 ? "" : path.substring(index);
}
File.join = function() {
    return Array.prototype.join.apply(arguments, [File.SEPARATOR]);
}
File.canonicalize = function(path) {
    return path.replace(/[^\/]+\/\.\.\//g, "").replace(/([^\.])\.\//, "$1").replace(/^\.\//, "");
}

Dir = {};
Dir.pwd = function() { return "." }; // FIXME


// Hash object

Hash = {};
Hash.merge = function(hash, other) {
    var merged = {};
    if (hash) Hash.update(merged, hash);
    if (other) Hash.update(merged, other);
    return merged;
}
Hash.update = function(hash, other) {
    for (var key in other)
        hash[key] = other[key];
    return hash;
}
Hash.forEach = function(hash, block) {
    for (var key in hash)
        block(key, hash[key]);
}
Hash.map = function(hash, block) {
    var result = [];
    for (var key in hash)
        result.push(block(key, hash[key]));
    return result;
}


// HashP : Case Preserving hash, used for headers

HashP = {};
HashP.get = function(hash, key) {
    var ikey = HashP._findKey(hash, key);
    if (ikey !== null)
        return hash[ikey];
    // not found
    return undefined;
}
HashP.set = function(hash, key, value) {
    // do case insensitive search, and delete if present
    var ikey = HashP._findKey(hash, key);
    if (ikey && ikey !== key)
        delete hash[ikey];
    // set it, preserving key case
    hash[key] = value;
}
HashP.includes = function(hash, key) {
    return HashP.get(hash, key) !== undefined
}
HashP.merge = function(hash, other) {
    var merged = {};
    if (hash) HashP.update(merged, hash);
    if (other) HashP.update(merged, other);
    return merged;
}
HashP.update = function(hash, other) {
    for (var key in other)
        HashP.set(hash, key, other[key]);
    return hash;
}
HashP.forEach = Hash.forEach;
HashP.map = Hash.map;

HashP._findKey = function(hash, key) {
    // optimization
    if (hash[key] !== undefined)
        return key;
    // case insensitive search
    var key = key.toLowerCase();
    for (var i in hash)
        if (i.toLowerCase() === key)
            return i;
    return null;
}


// Array additions

if (typeof Array.prototype.forEach !== "function")
    Array.prototype.forEach =  function(block) { for (var i = 0; i < this.length; i++) block(this[i]); };

isArray = function(obj) { return obj && typeof obj === "object" && obj.constructor === Array; }


// String additions

String.prototype.forEach = function(block, separator) {
    block(String(this)); // RHINO bug: it things "this" is a Java string (?!)
    
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


// IO

IO = function() {}
IO.prototype.puts = function() {
    this.write(arguments.length === 0 ? "\n" : Array.prototype.join.apply(arguments, ["\n"]));
}
IO.prototype.write = function(object) {
    this.writeStream(String(object));
};
IO.prototype.flush = function() {};


// Logging

log = {};
log.error = function(string) {
    if (typeof print === "function")
        print(string);
}
log.debug = debug ? log.error : function(){};

// Interpreter specific code:

// setup STDOUT and STDERR:
STDOUT = new IO();
STDERR = new IO();

// Rhino
if (typeof Packages !== "undefined")
{
    STDOUT.writeStream = function(string) { Packages.java.lang.System.out.print(string); };
    STDERR.writeStream = function(string) { Packages.java.lang.System.err.print(string); };
}
// Other
else
{
    STDERR.writeStream = function(){};
    
    if (typeof print === "function")
        STDOUT.writeStream = function(string) { print(string); };
    else
        STDOUT.writeStream = function() {};
}

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
// TODO: implement a File object on top of readFile instead of vice versa

ARGV = __global__.arguments ||  [];

})(this);
