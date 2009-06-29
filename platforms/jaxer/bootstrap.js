/**
 * Bootstrap code for Narwhal on Jaxer
 * @author Nathan L Smith <nlloyds@gmail.com>
 * @date June 26, 2009
 */

/*global Components, Jaxer */
/*jslint evil:true */

if (typeof Jaxer !== "object" || !Jaxer.isOnServer) { 
    throw new Error("Must be run in the server-side Jaxer environment");
}

(function (evalGlobal) {
    var env = Components.classes["@mozilla.org/process/environment;1"].
            getService(Components.interfaces.nsIEnvironment);
        // Check the environment, the jaxer config, then /opt/narwhal
        prefix = env.get("NARWHAL_HOME") || Jaxer.Config.NARWHAL_HOME || 
            "/opt/narwhal",
        read = Jaxer.File.read,
        isFile = function (path) {
            try { 
                return Jaxer.File.exists(path);
            } catch (e) { return false; }
        };

    eval(read(prefix + "/narwhal.js"))({
        global: this,
        evalGlobal: evalGlobal,
        platform: 'jaxer',
        platforms: ['jaxer', 'xulrunner', 'default'],
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
        fs: { read: read, isFile: isFile },
        prefix: prefix
    });
}).call(this, function () { return eval(arguments[0]); });
