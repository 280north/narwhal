/**
 * Bootstrap code for Narwhal on Jaxer
 * @author Nathan L Smith <nlloyds@gmail.com>
 * @date June 26, 2009
 */

/*global Jaxer */
/*jslint evil:true */

if (typeof Jaxer !== "object" || !Jaxer.isOnServer) { 
    throw new Error("Must be run in the server-side Jaxer environment");
}

(function (evalGlobal) {
    var prefix = "/opt/narwhal", // TODO: Make this configurable
        isFile = function (path) {
            try { 
                return Jaxer.File.exists(path);
            } catch (e) { return false; }
        };

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
            read: Jaxer.File.read,
            isFile: isFile
        },
        prefix: prefix
    });
}).call(this, function () { return eval(arguments[0]); });
