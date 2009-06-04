/**
 * Bootstrap file for the mozilla platform.
 * 
 * Sample loader to load this bootstrap file from an extension/app
 * can be found in ./example/bootloader.js
 */

(function(global, evalGlobal) {
  
    const Cc = Components.classes;
    const Ci = Components.interfaces;
    //const EM = Cc["@mozilla.org/extensions/manager;1"].getService(Ci.nsIExtensionManager);
    //const ID = bootloader.platform.mozilla.extension.id;
    const ENV = Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);
    
    var debug = false;
    var NARWHAL_PATH = ENV.exists('NARWHAL_PATH') ? ENV.get('NARWHAL_PATH') : null,
        NARWHAL_HOME = ENV.exists('NARWHAL_HOME') ? ENV.get('NARWHAL_HOME') : null,
        NARWHAL_PLATFORM_HOME = ENV.exists('NARWHAL_PLATFORM_HOME') ? ENV.get('NARWHAL_PLATFORM_HOME') : null;

    function print (message) {
        dump(message + '\n')
    }

    print('NARWHAL_PLATFORM_HOME: ' + NARWHAL_PLATFORM_HOME);
    print('NARWHAL_HOME: ' + NARWHAL_HOME);
    print('NARWHAL_PATH: ' + NARWHAL_PATH);

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
            return file.exists() && file.isFile();
        } catch (e) {
            return false;
        }
    };

    var narwhal = eval(read(getFile(NARWHAL_HOME, 'narwhal.js').path));
    narwhal({
        global: global,
        evalGlobal: evalGlobal,
        platform: 'narwzilla',
        platforms: ['narwzilla', 'default'],
        debug: debug,
        print: print,
        evaluate: function (text) eval("(function(require,exports,system,print){" + text + "/**/\n})"),
        read: read,
        isFile: isFile,
        prefix: NARWHAL_HOME,
        path: NARWHAL_PATH
    });
})(this, function () {
    return eval(arguments[0]);
});

