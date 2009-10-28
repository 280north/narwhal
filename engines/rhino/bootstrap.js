(function(global, evalGlobal) {

    /*
        this is a minimal engine-specific thunk for narwhal.js
        that brings the NARWHAL_PATH environment variable into the global
        scope using Rhino's special access to Java.
    */

    var moduleScopingEnabled = false;

    /* this gets used for several fixtures */
    var context = Packages.org.mozilla.javascript.Context.getCurrentContext();
    context.getWrapFactory().setJavaPrimitiveWrap(false); 

    // TODO: enable this via a command line switch
    context.setOptimizationLevel(-1);
    
    var prefix = "";
    if (typeof NARWHAL_HOME != "undefined") {
        prefix = NARWHAL_HOME;
        delete NARWHAL_HOME;
    } else {
        prefix = String(Packages.java.lang.System.getenv("NARWHAL_HOME") || "");
    }

    var enginePrefix = "";
    if (typeof NARWHAL_ENGINE_HOME != "undefined") {
        enginePrefix = NARWHAL_ENGINE_HOME;
        delete NARWHAL_ENGINE_HOME;
    } else {
        enginePrefix = String(Packages.java.lang.System.getenv("NARWHAL_ENGINE_HOME") || "");
    }

    var prefixes = [prefix, enginePrefix];

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
        return function (inject) {
            var names = [];
            for (var name in inject)
                if (Object.prototype.hasOwnProperty.call(inject, name))
                    names.push(name);
            return context.compileFunction(
                global,
                "function(" + names.join(",") + "){" + text + "\n//*/\n}",
                name,
                lineNo,
                null
            ).apply(null, names.map(function (name) {
                return inject[name];
            }));
        };
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

    try {
        narwhal({
            system: {
                global: global,
                evalGlobal: evalGlobal,
                engine: 'rhino',
                engines: ['rhino', 'default'],
                os: os,
                print: print,
                prefix: prefix,
                prefixes: prefixes,
                evaluate: evaluate,
                debug: debug,
                verbose: verbose
            },
            file: {
                read: read,
                isFile: isFile
            }
        });
    } catch (e) {
        if (e.rhinoException)
            e.rhinoException.printStackTrace();
        if (e.javaException)
            e.javaException.printStackTrace();
        print(e);
        Packages.java.lang.System.exit(1);
    }
        
})(this, function () {
    return eval(arguments[0]);
});
