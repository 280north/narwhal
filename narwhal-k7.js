(function (evalGlobal) {

    var prefix = ENV["NARWHAL_HOME"];
    var path = ENV["NARWHAL_PATH"];
    var debug = false;

    _system = system;

    var fopen = _system.posix.fopen,
        fread = _system.posix.fread,
        fclose = _system.posix.fclose;

    var read = function(path) {
        var result = "",
            fd = fopen(path, "r");
        if (!fd)
            throw new Error("File not found");
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
            throw new Error("File not found (length=0)");
        
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
        prefix: prefix,
        path: path
    });

}).call(this, function () {
    return eval(arguments[0]);
});
