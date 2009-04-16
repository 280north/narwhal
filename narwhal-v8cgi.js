(function () {

    var prefix = ".";
    var path = prefix + '/lib';

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
        debug: false,
        print: print,
        read: read,
        prefix: prefix,
        path: path
    });

}).call(this);
