(function (evalGlobal) {

    var global = /*TODO*/; // object

    var debug = false; /*TODO*/ // boolean

    var read = /*TODO*/; // function(path:string):string

    var isFile = /*TODO*/; // function(path:string):boolean

    var path = [/*TODO*/]; // array of path strings

    var prefix = "/path/to/narwhal"; /*TODO*/

    eval(read(prefix + "/narwhal.js"))({
        global: global,
        evalGlobal: evalGlobal,
        platform: '<<<name>>>', /*TODO*/
        platforms: ['<<<name>>>'], /*TODO*/
        debug: debug,
        print: print,
        evaluate: function (text) {
            // or something better here:
            return eval(
                "(function(require,exports,system,print){" +
                text +
                "/**/\n})"
            );
        },
        read: read,
        isFile: isFile,
        prefix: prefix,
        path: path
    });

}).call(this, function () {
    return eval(arguments[0]);
});
