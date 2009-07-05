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
        var path = new java.io.File(path);

        if (!path.isFile())
            throw new Error(path + ' does not exist.');

        var stream = new java.io.FileInputStream(path);
        try {

            var length = 1025;
            var index = 0;
            var total = 0;
            var buffer;
            var buffers = [];

            do {
                if (buffer === undefined)
                    buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, length);
                var read = stream.read(buffer, index, buffer.length - index);
                if (read < 0)
                    break;
                index += read;
                total += read;
                if (index >= buffer.length) {
                    buffers.push(buffer);
                    buffer = undefined;
                    index = 0;
                    length *= 2;
                }
                //print("read="+read+" index="+index+" total="+total+" length="+length+" buffers.length="+buffers.length);
            } while (read > 0);

            var resultBuffer, resultLength;
            if (buffers.length === 1 && index === 0) {
                resultBuffer = buffers[0];
                resultLength = resultBuffer.length;
            } else {
                resultBuffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, total),
                resultLength = 0;
                for (var i = 0; i < buffers.length; i++) {
                    var buf = buffers[i];
                    java.lang.System.arraycopy(buf, 0, resultBuffer, resultLength, buf.length);
                    resultLength += buf.length;
                }
                if (index > 0) {
                    java.lang.System.arraycopy(buffer, 0, resultBuffer, resultLength, index);
                    resultLength += index;
                }
            }
            
            if (total != resultLength || total !== resultBuffer.length)
                throw new Error("IO.read sanity check failed: total="+total+" resultLength="+resultLength+" resultBuffer.length="+resultBuffer.length);

            var result = String(new java.lang.String(resultBuffer, 'UTF-8'));
            return result;

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

    narwhal({
        global: global,
        evalGlobal: evalGlobal,
        platform: 'rhino',
        platforms: ['rhino', 'default'],
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
