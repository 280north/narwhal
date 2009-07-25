(function(global, evalGlobal) {

    /*
        this is a minimal platform-specific thunk for narwhal.js
        that brings the NARWHAL_PATH environment variable into the global
        scope using Rhino's special access to Java.
    */

    var moduleScopingEnabled = false;

    /* this gets used for several fixtures */
    var context = Packages.org.mozilla.javascript.Context.getCurrentContext();

    var prefix = "";
    if (typeof NARWHAL_HOME != "undefined") {
        prefix = NARWHAL_HOME;
        delete NARWHAL_HOME;
    } else {
        prefix = String(Packages.java.lang.System.getenv("NARWHAL_HOME") || "");
    }

    var packagePrefixes = [prefix];

    if (typeof SEA != "undefined") {
        packagePrefixes.push(SEA);
    }

    // TODO: enable this via a command line switch
    context.setOptimizationLevel(-1);

    var isFile = function (path) {
        try { return new java.io.File(path).isFile(); } catch (e) {}
        return false;
    };

    var read = function (path) {
        var path = new java.io.File(path),
            stream = new java.io.FileInputStream(path);
        try {
            var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, path.length());
            stream.read(buffer);
            return String(new java.lang.String(buffer, "UTF-8"));
        } finally {
            stream.close();
        }
    };
    
    var evaluate = function (text, name, lineNo) {
        var scope;
        
        if (moduleScopingEnabled) {
            scope = new Object();
            scope.__parent__ = null;
            scope.__proto__ = global;
        } else {
            scope = global;
        }
        
        return context.compileFunction(
            scope,
            "function(require,exports,module,system,print){"+text+"\n// */\n}",
            name,
            lineNo,
            null
        );
    };

    delete global.print;
    var print = function (string) {
        Packages.java.lang.System.out.println(String(string));
    };

    var narwhal = context.evaluateReader(
        global,
        new Packages.java.io.FileReader(prefix + "/narwhal.js"),
        "narwhal.js",
        1,
        null
    );

    var debug = +String(Packages.java.lang.System.getenv("NARWHAL_DEBUG"));
    var verbose = +String(Packages.java.lang.System.getenv("NARWHAL_VERBOSE"));
    var os = String(Packages.java.lang.System.getProperty("os.name"));

    narwhal({
        global: global,
        evalGlobal: evalGlobal,
        platform: 'rhino',
        platforms: ['rhino', 'default'],
        os: os,
        print: print,
        fs: {
            read: read,
            isFile: isFile
        },
        prefix: prefix,
        packagePrefixes: packagePrefixes,
        evaluate: evaluate,
        debug: debug,
        verbose: verbose
    });
        
})(this, function () {
    return eval(arguments[0]);
});
