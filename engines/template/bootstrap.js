(function (evalGlobal) {
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

    var read = /*TODO*/; // function(path:string):string

    var isFile = /*TODO*/; // function(path:string):boolean

    var prefix = "/path/to/narwhal"; /*TODO*/
    var enginePrefix = "/path/to/engine"; /*TODO*/
    
    eval(read(prefix + "/narwhal.js"))({
        system: {
            global: this,
            evalGlobal: evalGlobal,
            engine: '<<<name>>>', /*TODO*/
            engines: ['<<<name>>>', 'default'], /*TODO*/
            os: "", /* TODO /\bwindows\b/i for Windows FS support */
            // XXX engines may include any number of
            // prioritized generic engines like:
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
            prefix: prefix,
            prefixes: [prefix],
            enginePrefix: enginePrefix,
            debug: false,
            verbose: false
        },
        file: {
            read: read,
            isFile: isFile
        }
    });

}).call(this, function () {
    return eval(arguments[0]);
});
