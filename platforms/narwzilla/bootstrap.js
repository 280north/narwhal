/**
 * Bootstrap file for the mozilla platform.
 */

(function(global, evalGlobal) {
  
    const Cc = Components.classes;
    const Ci = Components.interfaces;
    const Cu = Components.utils;
    const Env = Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);
    const Loader = Cc['@mozilla.org/moz/jssubscript-loader;1'].getService(Ci.mozIJSSubScriptLoader);

    var moduleScopingEnabled = false;
    var debug = true;
    var NARWHAL_PATH = Env.exists('NARWHAL_PATH') ? Env.get('NARWHAL_PATH') : null,
        NARWHAL_HOME = Env.exists('NARWHAL_HOME') ? Env.get('NARWHAL_HOME') : null;

    function print (message) {
        dump(message + '\n')
    }

    function getFileUri(file) {
        return Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService)
            .getProtocolHandler('file').QueryInterface(Ci.nsIFileProtocolHandler)
            .getURLSpecFromFile(file);
    }

    function getFile(path) {
        var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
        file.initWithPath(path);
        for (var i=1; i < arguments.length; i++) file.append(arguments[i])
        return file;
    }

    function read(path) {
        const MODE_RDONLY = 0x01;
        const PERMS_FILE = 0644;
        var result = [];
        try {
            var fis = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
            fis.init(getFile(path), MODE_RDONLY, PERMS_FILE, false);
            var lis = fis.QueryInterface(Ci.nsILineInputStream);
            var line = { value: null };
            var haveMore;
            do {
                haveMore = lis.readLine(line)
                result.push(line.value);
            } while (haveMore)
        } catch(e) {
            print('Error:' + e.message);
            print('Stack:' + e.stack);
        } finally {
            fis.close();
        }
        return result.join('\n');
    }

    function isFile(path) {
        try {
            var file = getFile(path);
            return (file.exists() && file.isFile());
        } catch (e) {
            return false;
        }
    }

    function evaluateInSandbox(code, path, lineNo) {
        lineNo = lineNo || 0;
        path = path || "anonymus";
        var scope;
        if (moduleScopingEnabled) {
            scope = new Object();
            scope.__parent__ = null;
            scope.__proto__ = global;
        } else {
            scope = global;
        }
        var sandbox = Cu.Sandbox(Cc["@mozilla.org/systemprincipal;1"].createInstance(Ci.nsIPrincipal));
        sandbox.global = global;
        sandbox.scope = scope;
        sandbox.code = code;
        var source = 'with (scope) new Function(["require", "exports", "module", "system", "print"], code);';
        return Cu.evalInSandbox(source, sandbox, "1.8", path, lineNo);
    }
    function evaluate(code, path, lineNo) {
        lineNo = lineNo || 0;
        path = path || "anonymus";
        var scope;
        if (moduleScopingEnabled) {
            scope = new Object();
            scope.__parent__ = null;
            scope.__proto__ = global;
        } else {
            scope = global;
        }
        with (scope) return new Function(["require", "exports", "module", "system", "print"], code);
    }

    var narwhal = Loader.loadSubScript(getFileUri(getFile(NARWHAL_HOME, 'narwhal.js')), global);
    narwhal({
        global: global,
        evalGlobal: evalGlobal,
        evaluate: evaluate,
        platform: 'narwzilla',
        platforms: ['narwzilla', 'default'],
        debug: debug,
        print: print,
        fs: {
            read: read,
            isFile: isFile
        },
        prefix: NARWHAL_HOME,
        path: NARWHAL_PATH
    });
})(this, function(code) {
    return (new Function([], code))();
});

