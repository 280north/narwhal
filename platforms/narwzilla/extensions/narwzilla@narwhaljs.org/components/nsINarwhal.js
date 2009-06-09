const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const Loader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
const Env = Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);
const ResourceHandler = Cc['@mozilla.org/network/protocol;1?name=resource'].getService(Ci.nsIResProtocolHandler);
const IOService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService)
const FileService = IOService.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

var NARWHAL_HOME = "NARWHAL_HOME",
    PLATFORM_HOME = "NARWHAL_PLATFORM_HOME",
    PATH = "NARWHAL_PATH",
    JS_PATH = "JS_PATH";
var APP_STARTUP = "app-startup";

/**
 * Utility function which returns file for a correspoding path.
 * If the additional arguments passed appends their values to the
 * given path.
 * @param {String}          file / dir path
 * @returns nsIFile
 */
function getFile(path) {
    var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    file.initWithPath(path);
    for (var i=1; i < arguments.length; i++) file.append(arguments[i])
    return file;
}
/**
 * Utility function which returns file uri for a correspoding file.
 * @param {nsIFile}         file / dir path
 * @param String            corresponding file uri (file:///foo/bar)
 */
function getFileUri(file) FileService.getURLSpecFromFile(file);
function readFile(file) {
    const MODE_RDONLY = 0x01;
    const PERMS_FILE = 0644;
    var result = [];
    try {
        var fis = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        fis.init(file, MODE_RDONLY, PERMS_FILE, false);
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

/**
 * Utility function which returns file for a correspoding resource file.
 * @param {String}          resource uri
 * @param nsIFile           corresponding file
 */
function getResourceFile(uri) FileService.getFileFromURLSpec(ResourceHandler.resolveURI(IOService.newURI(uri, null, null)));
/**
 * XPCOM handles command line argument -narwhal. If argument is followed by
 * value it will be used as a path to the bootstarp.js, Otherwise looks for
 * ENV variable NARWHAL_HOME and if" its defined looks for narwzilla platform
 * and uses it"s bootstrap.js to load.
 */
function CommandLineBoot() {}
CommandLineBoot.prototype = {
    classDescription: "Narwhal boot from command line",
    classID: Components.ID("{8082de70-034e-444f-907f-a79543016e7c}"),
    contractID: "@narwhaljs.org/narwzilla/boot/command-line;1",
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsICommandLineHandler]),
    _xpcom_categories: [{ category: "command-line-handler" }],
    handle: function(cmdLine) {
        var bootstrap;
        // trying to get passed bootstrap.js (narwhal-narwzilla will pass it)
        try { bootstrap = getFile(cmdLine.handleFlagWithParam("narwhal", false)); } catch (e) {}
        // trying to read NARWHAL_HOME env variable
        if (!bootstrap && cmdLine.handleFlag("narwhal", false)) {
            try {
                var path = Env.get(NARWHAL_HOME);
                bootstrap = getFile(path, "platforms", "narwzilla", "bootstrap.js");
            } catch(e) {}
        }
        bootstrapNarwhal(bootstrap);
    },
    helpInfo: "-narwhal [path]             Bootstrap narwhal\nwill boot narwhal from the bootstar path. If not specified will look for ENV variable NARWHAL_HOME"
}
/**
 * XPCOM observes application startup. If there is narwhal extension installed
 * it will use as a path to the bootstarp.js to load, Otherwise looks for.
 */
function AppStartupBoot() {}
AppStartupBoot.prototype = {
    classDescription: "Narwhal boot on app startup",
    classID: Components.ID("{8f0feebb-4fdc-9946-bd17-445a2e7d6557}"),
    contractID: "@narwhaljs.org/narwzilla/boot/start-up;1",
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsIObserver]),
    _xpcom_categories: [{ category: APP_STARTUP, service: true }],
    observe: function(subject, topic, data) {
        if (topic == APP_STARTUP) this.boot();
    },
    boot: function() {
        try {
            bootstrapNarwhal(getResourceFile("resource://narwhal/platforms/narwzilla/bootstrap.js"));
        } catch(e) {}
    }
};
/**
 * Modifies Narwhal XPCOM so that it will be able to expose
 * require, print, system to the privileged scopes.
 * @param {nsIFile}     bootstrap.js file
 */
function bootstrapNarwhal(bootstrap) {
    if (bootstrap && bootstrap.exists())
        try {
            if (!Env.exists(NARWHAL_HOME))
                Env.set(NARWHAL_HOME, bootstrap.parent.parent.parent.path);
            if (!Env.exists(PLATFORM_HOME))
                Env.set(PLATFORM_HOME, bootstrap.parent.path);
            if (!Env.exists(PATH)) {
                var path = [];
                var narwhalHome = Env.get(NARWHAL_HOME);
                var narwzillaHome = Env.get(PLATFORM_HOME);

                var platformLib = getFile(narwzillaHome, "lib");
                var defaultLib = getFile(narwhalHome, "platforms", "default", "lib");
                var narwhalLib = getFile(narwhalHome, "lib");
                if (platformLib.exists()) path.push(platformLib.path);
                if (defaultLib.exists()) path.push(defaultLib.path);
                if (narwhalLib.exists()) path.push(narwhalLib.path);
                if (Env.exists(JS_PATH)) path.push(Env.get(JS_PATH))
                Env.set(PATH, path.join(":"))
            }
            var sandbox = Cu.Sandbox(Cc["@mozilla.org/systemprincipal;1"].createInstance(Ci.nsIPrincipal));
            Cu.evalInSandbox(readFile(bootstrap), sandbox, "1.8", bootstrap.path, 0);
            Narwhal.prototype.__proto__ = sandbox;
        } catch(e) {
            dump("narwzilla> Error:" + e.message + "\nStack:" + e.stack + "\n");
        }
}
/**
 * Instance of Narwhal for simulateing of a singleton object.
 * This is required, because we"re registered for the "JavaScript global
 * privileged property" category, whose handler always calls createInstance.
 * See bug 386535.
 */
var narwhal;
/**
 * XPCOM Exposes object "global" to all privileged scopes. Object contains
 * system, require, print.
 */
function Narwhal() {};
Narwhal.Interfaces = [Ci.nsISupports, Ci.nsIClassInfo, Ci.nsINarwhal];
Narwhal.prototype = {
    classDescription: "Narwhal",
    classID: Components.ID("{d438150e-51a2-4f45-9de9-619f5ab01a90}"),
    contractID: "@narwhaljs.org/narwzilla/global;1",
    QueryInterface: XPCOMUtils.generateQI(Narwhal.Interfaces),
    _xpcom_categories: [{
        // http://mxr.mozilla.org/seamonkey/source/dom/public/nsIScriptNameSpaceManager.h
        category: "JavaScript global privileged property",
        entry: "global"
    }],
    _xpcom_factory: {
        createInstance: function(outer, iid) {
            if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;
            if (!narwhal) narwhal = new Narwhal();
            narwhal.QueryInterface(iid);
            return narwhal;
        }
    },
    // nsIClassInfo
    implementationLanguage: Ci.nsIProgrammingLanguage.JAVASCRIPT,
    getHelperForLanguage: function(number) null,
    getInterfaces: function(number) {
        number.value = Narwhal.Interfaces.length;
        return Narwhal.Interfaces;
    }
};

var components = [CommandLineBoot, AppStartupBoot, Narwhal];
function NSGetModule(compMgr, fileSpec) XPCOMUtils.generateModule(components);
