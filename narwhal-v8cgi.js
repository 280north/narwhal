(function (evalGlobal) {

    var prefix = ".";
    var path = prefix + '/lib';

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
        platform: 'v8cgi',
        platforms: ['v8cgi', 'v8', 'c', 'default'],
        debug: false,
        print: print,
        read: read,
        isFile: isFile,
        prefix: prefix,
        path: path
    });

}).call(this, function () {
    return eval(arguments[0]);
});
