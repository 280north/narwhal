(function () {

    var prefix = ENV["NARWHAL_HOME"];
    var path = ENV["NARWHAL_PATH"];
    var debug = false;

    var read = function(path) {
        var result = "",
            fd = system.posix.fopen(path, "r");
        if (!fd)
            throw new Error("File not found");
        try {
            var length = 1024,
                data;
            do {
                length *= 2;
                data = system.posix.fread(1, length, fd);
                result += data;
            } while (data.length === length);
        } finally {
            system.posix.fclose(fd);
        }
        if (result.length === 0)
            throw new Error("File not found (length=0)");
        
        return result;
    }

    var print = _print;
    delete print;

    eval(read(prefix + "/narwhal.js"))({
        global: this,
        debug: debug,
        print: function (string) {
            _print("" + string + "\n");
        },
        read: read,
        prefix: prefix,
        path: path
    });

}).call(this);
