(function (evalGlobal) {

    // NOTE: Newer version of K7 (>May 2009) does not but anything
    // else than modules in the global namespace
    if (typeof(ENV) == "undefined") {
        GLOBAL     = system.GLOBAL
        ENV        = system.ENV;
        print      = system.shell.print;
    }

    var prefix = ENV["NARWHAL_HOME"];
    var debug = false;

    _system = system;

    var fopen = _system.posix.fopen,
        fread = _system.posix.fread,
        fclose = _system.posix.fclose;

    var isFile = function (path) {
        try { read(path); } catch(e) { return false; }
        return true;
    };

    var read = function(path) {
        var result = "",
            fd = fopen(path, "r");
        if (!fd)
            throw new Error("File not found: " + path);
        try {
            var length = 1024,
                data;
            do {
                length *= 2;
                data = fread(1, length, fd);
                result += data;
            } while (data.length === length);
        } finally {
            fclose(fd);
        }
        if (result.length === 0)
            throw new Error("File not found (length=0): " + path);
        return result;
    };

    var isFile = function(path) {
        return _system.posix.isFile(path);
    }

    var _print = print;
    delete print;

    eval(read(prefix + "/narwhal.js"))({
        global: GLOBAL,
        evalGlobal: evalGlobal,
        platform: 'k7',
        platforms: ['k7', 'v8', 'c', 'default'],
        debug: debug,
        print: function (string) {
            _print("" + string);
        },
        evaluate: function (text) {
             return eval("(function(require,exports,module,system,print){" + text + "/**/\n})");
        },
        fs: {
            read: read,
            isFile: isFile
        },
        prefix: prefix,
        complianceStage: "system"
    });

})(function () {
    return eval(arguments[0]);
});

//throw "Exiting. (FIXME: this exception does not mean an actual error occurred, we just need a better way to exit)";
// EOF - vim: ts=4 sw=4 et
