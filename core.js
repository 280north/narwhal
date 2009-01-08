(function() {

// TODO: make an IO class and Rhino specific subclass for this
STDERR = {
    puts  : function()       { this.write(arguments.length === 0 ? "\n" : Array.prototype.join.apply(arguments, ["\n"])); },
    write : function(string) { Packages.java.lang.System.err.println(string); },
    flush : function()       {}
}

// Ruby style "require" and "include" (can't used "load" as it's taken by several JS shells)

if (typeof $s === "undefined")
    $s = ["."];

var requireExtensions   = [".js"],// ".j"],
    requireFileStack    = ["."], // FIXME: only works on "first pass", not includes in functions called from different file, etc
    requireLoadedFiles  = {};

include = function(name) {
    if (name.charAt(0) === "/")
    {
        if (attemptLoad(name, name))
            return true;
    }
    else
    {
        var pwd = dirname(requireFileStack[requireFileStack.length-1]),
            extensions = (/\.\w+$/).test(name) ? [""] : requireExtensions;
        for (var j = 0; j < extensions.length; j++)
        {
            var ext = extensions[j];
            for (var i = 0; i < $s.length; i++)
            {
                var searchDirectory = ($s[i] === ".") ? pwd : $s[i],
                    path = searchDirectory + "/" + name + ext;
                    
                if (attemptLoad(name, path))
                    return true;
            }
        }
    }
    
    throw new Error("No such file to load: " + name);
    
    return false;
}    

require = function(name) {
    if (requireLoadedFiles[name])
        return false;
    return include(name);
}

var attemptLoad = function(name, path) {
    var code;
    
    // some interpreters throw exceptions
    try { code = readFile(path); } catch (e) {}
    
    if (code)
    {
        requireLoadedFiles[name] = path;
        requireFileStack.push(path);
        
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

// TODO: create a File object, make this a method
dirname = function(path) {
    var raw = String(path),
        match = raw.match(/^(.*)\/[^\/]+\/?$/);
    if (match && match[1])
        return match[1]
    else if (raw.charAt(0) == "/")
        return "/"
    else
        return "."
}

isArray = function(obj) { return obj && typeof obj === "object" && obj.constructor === Array; }

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

Hash = function(hash) {
    this.hash = {};
    this.merge(hash);
}
Hash.prototype.get      = function(k)    { return this.hash[k]; }
Hash.prototype.set      = function(k, v) { this.hash[k] = v; }
Hash.prototype.unset    = function(k)    { delete this.hash[k]; }
Hash.prototype.includes = function(k)    { return this.get(k) !== undefined; }
Hash.prototype.merge = function(other) {
    if (!other) return;
    var hash = other.hash || other;
    for (var key in hash)
        this.set(key, hash[key]);
}
Hash.prototype.each = function(block) {
    for (var key in this.hash)
        block(key, this.hash[key]);
}
Hash.prototype.map = Enumerable.map;


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

Array.prototype.each = Array.prototype.forEach || function(block) { for (var i = 0; i < this.length; i++) block(this[i]); };


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

})();