(function (evalGlobal) {

    var read = /*TODO*/; // function(path:string):string

    var isFile = /*TODO*/; // function(path:string):boolean

    var prefix = "/path/to/narwhal"; /*TODO*/
    
    eval(read(prefix + "/narwhal.js"))({
        global: this,
        evalGlobal: evalGlobal,
        platform: '<<<name>>>', /*TODO*/
        platforms: ['<<<name>>>', 'default'], /*TODO*/
        os: "", /* TODO /\bwindows\b/i for Windows FS support */
        // XXX platforms may include any number of
        // prioritized generic platforms like:
        // rhino, java, c, v8, default
        print: print,
        evaluate: function (text) {
            // TODO maybe something better here:
            return eval(
                "(function(require,exports,module,system,print){" +
                text +
                "/**/\n})"
            );
        },
        fs: {
            read: read,
            isFile: isFile
        },
        prefix: prefix,
        debug: false,
        verbose: false
    });

}).call(this, function () {
    return eval(arguments[0]);
});
