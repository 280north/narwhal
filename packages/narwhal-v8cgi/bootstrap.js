(function (evalGlobal) {

    var prefix = ".";

    var isFile = function (path) {
        return new File(path).exists();
    };

    var read = function(path) {
        var result = "",
            f = new File(path);
        try {
            if (!f.exists())
                throw new Error();
                
            f.open("r");
            result = f.read();
            
        } finally {
            f.close();
        }
        return result;
    };
    
    eval(read(prefix + "/narwhal.js"))({
        global: this,
        evalGlobal: evalGlobal,
        engine: 'v8cgi',
        engines: ['v8cgi', 'v8', 'c', 'default'],
        debug: false,
        print: print,
        fs: {
            read: read,
            isFile: isFile
        },
        prefix: prefix
    });

}).call(this, function () {
    return eval(arguments[0]);
});
