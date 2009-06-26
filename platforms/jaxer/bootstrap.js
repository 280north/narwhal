/**
 * Bootstrap code for Narwhal on Jaxer
 * @author Nathan L Smith <nlloyds@gmail.com>
 * @date June 26, 2009
 */

/*global Jaxer */
/*jslint evil:true */
(function (evalGlobal) {
    var prefix = "/opt/narwhal", // TODO: Make this configurable
        read = Jaxer.File.read;
    eval(read(prefix + "/narwhal.js"))({
        global: this,
        evalGlobal: evalGlobal,
        platform: 'jaxer',
        platforms: ['jaxer', 'default'],
        print: function () { 
            var moduleLogger = Jaxer.Log.forModule("narwhal")
            moduleLogger.info.apply(moduleLogger, arguments);
        },
        evaluate: function (text, fileName) {
            return Jaxer.Includer.evalOn(
                "(function(require,exports,module,system,print){" + text + 
                    "/**/\n})",
                this,
                fileName);
        },
        fs: {
            read: read,
            isFile: Jaxer.File.exists
        },
        prefix: prefix
    });
}).call(this, function () { return eval(arguments[0]); });
