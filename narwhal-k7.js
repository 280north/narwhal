(function () {

    NARWHAL_HOME = ENV["NARWHAL_HOME"];
    NARWHAL_PATH = ENV["NARWHAL_PATH"];

    narwhalReadFile = function(path) {
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

    var _print = print;
    print = function(string) {
        _print(string + "\n");
    }

    eval(narwhalReadFile(NARWHAL_HOME + "/narwhal.js"));
})();
