// This file contains some basic features that *should* be provided by a standard library

(function() {

// Ruby style "require" and "include" (can't used "load" as it's taken by several JS shells)

if (typeof $p === "undefined")
    $p = ["."];

var requireExtensions   = [".js"],
    requireFileStack    = ["."], // FIXME: only works on the "first pass", not includes in functions called from different file, etc
    requireLoadedFiles  = {};

include = function(name) {
    log.debug(" + include: " + name);
    
    if (name.charAt(0) === "/")
    {
        if (_attemptLoad(name, name))
            return true;
    }
    else
    {
        var pwd = File.dirname(requireFileStack[requireFileStack.length-1]),
            extensions = (/\.\w+$/).test(name) ? [""] : requireExtensions;
        for (var j = 0; j < extensions.length; j++)
        {
            var ext = extensions[j];
            for (var i = 0; i < $p.length; i++)
            {
                var searchDirectory = ($p[i] === ".") ? pwd : $p[i],
                    path = searchDirectory + "/" + name + ext;
                    
                if (_attemptLoad(name, path))
                    return true;
            }
        }
    }
    
    throw new Error("No such file to load: " + name);
    
    return false;
}    

require = function(name) {
    log.debug(" + require: " + name);
    
    if (requireLoadedFiles[name])
        return false;
    return include(name);
}

var _attemptLoad = function(name, path) {
    var code;
    
    log.debug(" + attemptLoad: " + path +" ("+name+")");
    
    // some interpreters throw exceptions
    try { code = readFile(path); } catch (e) {}
    
    if (code)
    {
        requireLoadedFiles[name] = path;
        requireFileStack.push(path);
        
        log.debug(" + eval-ing")
        
        var evalString = "(function(__FILE__){\n" + code+ "\n})('"+path+"')";
        
        // this gives us slightly better exception backtraces in Rhino
        if (typeof Packages !== "undefined")
            Packages.org.mozilla.javascript.Context.getCurrentContext().evaluateString(this, evalString, path, 0, null);
        else
            eval(evalString);
        
        requireFileStack.pop();

        return true;
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
File.join = function() {
    return Array.prototype.join.apply(arguments, [File.SEPARATOR]);
}


Dir = {};
Dir.pwd = function() { return "." }; // FIXME


// Enumerable module

Enumerable = {};
Enumerable.map = function(block) {
    var that = this,
        result = [];
    this.each(function() {
        result.push(block.apply(that, arguments));
    });
    return result;
}

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
Hash.each = function(hash, block) {
    for (var key in hash)
        block(key, hash[key]);
}
Hash.map = function(hash, block) {
    var result = [];
    for (var key in hash)
        result.push(block(key, hash[key]));
    return result;
}

// HashP : Case Preserving hash
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
HashP.each = Hash.each;
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

Array.prototype.reverse = function() {
    var result = [],
        i = this.length;
    while(i--) result[i] = this[this.length-i-1];
    return result;
}

Array.prototype.inject = function(block, initial) {
    var memo = (initial === undefined) ? this[0] : initial;
    for (var i = (initial === undefined) ? 1 : 0; i < this.length; i++)
        memo = block(memo, this[i]);
    return memo;
}

Array.prototype.any = function(block) {
    return Boolean(this.inject(function(m,o) { return m || block(o); }, false));
}

Array.prototype.each = Array.prototype.forEach || function(block) { for (var i = 0; i < this.length; i++) block(this[i]); };

isArray = function(obj) { return obj && typeof obj === "object" && obj.constructor === Array; }

// String additions

String.prototype.each = function(block, separator) {
    if (!separator)
        separator = /\n+/;
    
    this.split(separator).each(block);
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

// Function additions

Function.prototype.invoke = function() {
    return this.apply(this, arguments);
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
log.debug = function(string) {}


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
                if (Ruby.File["readable?"](file_name))
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

})();

// needs to be outside the function
if (typeof arguments !== "undefined")
    ARGV = arguments;
else
    ARGV = [];