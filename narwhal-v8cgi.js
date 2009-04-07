(function () {

    NARWHAL_PATH = 'lib';

    narwhalReadFile = function(path) {
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

})();
