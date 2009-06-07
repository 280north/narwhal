/**
 * Bootstrap file for the mozilla platform.
 */

(function(evalGlobal) {
  
    const Cc = Components.classes;
    const Ci = Components.interfaces;
    const Env = Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);
    const Loader = Cc['@mozilla.org/moz/jssubscript-loader;1'].getService(Ci.mozIJSSubScriptLoader);

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
    };

    var narwhal = Loader.loadSubScript(getFileUri(getFile(NARWHAL_HOME, 'narwhal.js')), this);
    //eval(read(NARWHAL_HOME + "/narwhal.js"))
    narwhal({
        global: this,
        evalGlobal: evalGlobal,
        platform: 'narwzilla',
        platforms: ['narwzilla', 'default'],
        debug: debug,
        print: print,
        evaluate: function (text) eval("(function(require,exports,system,print){" + text + "/**/\n})"),
        fs: {
            read: read,
            isFile: isFile
        },
        prefix: NARWHAL_HOME,
        path: NARWHAL_PATH
    });
}).call(this, function() {
    return eval(arguments[0]);
});

