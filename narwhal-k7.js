(function (evalGlobal) {

    var prefix = ENV["NARWHAL_HOME"];
    var path = ENV["NARWHAL_PATH"];
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
    }

    var _print = print;
    delete print;

    eval(read(prefix + "/narwhal.js"))({
        global: this,
        evalGlobal: evalGlobal,
        platform: 'k7',
        platforms: ['k7', 'v8', 'c', 'default'],
        debug: debug,
        print: function (string) {
            _print("" + string + "\n");
        },
        read: read,
        isFile: isFile,
        prefix: prefix,
        path: path,
        evaluate : function(text, name, line) {
            return new Function("require", "exports", "system", text);
        }
    });

}).call(this, function () {
    return eval(arguments[0]);
});
