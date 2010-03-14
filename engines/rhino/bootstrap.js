(function(global, evalGlobal) {
// -- tlrobinson Tom Robinson TODO
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- kriszyp Kris Zyp TODO
// -- gmosx George Moschovitis TODO

    /*
        this is a minimal engine-specific thunk for narwhal.js
        that brings the NARWHAL_PATH environment variable into the global
        scope using Rhino's special access to Java.
    */

    var moduleScopingEnabled = false;

    /* this gets used for several fixtures */
    var context = Packages.org.mozilla.javascript.Context.getCurrentContext();

    var setOptimizationLevel = function (n) {
        if (Packages.java.lang.System.getenv("NARWHAL_DEBUGGER") !== "1") {
            context.setOptimizationLevel(Number(n));
        }
    };

    // TODO reconcile these names RHINO_OPTI... and NARWHAL_OPT...
    if (typeof RHINO_OPTIMIZATION_LEVEL != "undefined") {
        context.setOptimizationLevel(RHINO_OPTIMIZATION_LEVEL);
    } else {
        context.setOptimizationLevel(+String(
            Packages.java.lang.System.getenv("NARWHAL_OPTIMIZATION") || -1
        ));
    }

    try{
    	context.setLanguageVersion(180);
    } catch (exception) {
    	// squelch language upgrades
    }

    context.getWrapFactory().setJavaPrimitiveWrap(false);

    var prefix = "";
    if (typeof NARWHAL_HOME != "undefined") {
        prefix = NARWHAL_HOME;
        delete NARWHAL_HOME;
    } else {
        prefix = String(Packages.java.lang.System.getenv("NARWHAL_HOME") || "");
    }

    if (typeof SEA != "undefined") {
        Packages.java.lang.System.setProperty("SEA", SEA);
        delete SEA;
    }

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

    var evaluate = function (text, fileName, lineNo) {
        return function (inject) {
            var names = [];
            for (var name in inject)
                if (Object.prototype.hasOwnProperty.call(inject, name))
                    names.push(name);
            return context.compileFunction(
                global,
                "function(" + names.join(",") + "){" + text + "\n//*/\n}",
                fileName,
                lineNo,
                null
            ).apply(null, names.map(function (name) {
                return inject[name];
            }));
        };
    };

    var importScript = function (script) {
        return context.evaluateReader(
            global,
            new Packages.java.io.FileReader(script),
            script,
            1,
            null
        );
    };

    var importScripts = function () {
        for (var i = 0, ii = arguments.length; i < ii; i++) {
            importScript(arguments[i]);
        };
    };

    delete global.print;
    var print = function (string) {
        Packages.java.lang.System.out.println(String(string));
    };

    var narwhal = importScript(prefix + "/narwhal.js");

    var debug = +String(Packages.java.lang.System.getenv("NARWHAL_DEBUG"));
    var verbose = +String(Packages.java.lang.System.getenv("NARWHAL_VERBOSE"));
    var os = String(Packages.java.lang.System.getProperty("os.name"));

    try {
        narwhal({
            system: {
                global: global,
                evalGlobal: evalGlobal,
                importScripts: importScripts,
                engine: 'rhino',
                engines: ['rhino', 'default'],
                os: os,
                print: print,
                prefix: prefix,
                evaluate: evaluate,
                debug: debug,
                verbose: verbose,
                setOptimizationLevel: setOptimizationLevel
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
