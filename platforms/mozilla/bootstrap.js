/**
 * Bootstrap file for the mozilla platform.
 * 
 * Sample loader to load this bootstrap file from an extension/app
 * can be found in ./example/bootloader.js
 */

(function (global, evalGlobal) {
  
    const Cc = Components.classes;
    const Ci = Components.interfaces;
    const EM = Cc["@mozilla.org/extensions/manager;1"].getService(Ci.nsIExtensionManager);
    const ID = bootloader.platform.mozilla.extension.id;
    
    var print = bootloader.platform.mozilla.print;

    var read = function(path) {
        var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        var cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
        fstream.init(EM.getInstallLocation(ID).getItemFile(ID, path), -1, 0, 0);
        cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish
        var data = "";
        var str = {};
        while (cstream.readString(4096, str) != 0) {
          data += (str.value);
        }
        return data;
    };
    
    var isFile = function(path) {
        return EM.getInstallLocation(ID).getItemFile(ID, path).exists();
    };
    
    var path = bootloader.path.lib;
    path.unshift(bootloader.path.narwhal + '/lib');
    path.unshift(bootloader.path.narwhal + '/platforms/default/lib');
    path.unshift(bootloader.path.narwhal + '/platforms/mozilla/lib');

    eval(read(bootloader.path.narwhal + "/narwhal.js"))({
        global: global,
        evalGlobal: evalGlobal,
        platform: 'mozilla',
        platforms: ['mozilla', 'default'],
        debug: bootloader.platform.mozilla.debug,
        print: print,
        evaluate: function (text) {
            return eval(
                "(function(require,exports,system,print){" +
                text +
                "/**/\n})"
            );
        },
        read: read,
        isFile: isFile,
        prefix: bootloader.path.narwhal,
        path: path.join(':')
    });

})(this, function () {
    return eval(arguments[0]);
});

