const Cc = Components.classes;
const Ci = Components.interfaces;

const Loader = Cc['@mozilla.org/moz/jssubscript-loader;1'].getService(Ci.mozIJSSubScriptLoader);
const Env = Cc['@mozilla.org/process/environment;1'].getService(Ci.nsIEnvironment);

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

/**
 * Utility function which returns file for a correspoding path.
 * If the additional arguments passed appends their values to the
 * given path.
 * @param {String}          file / dir path
 * @returns nsIFile
 */
function getFile(path) {
    var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
    file.initWithPath(path);
    for (var i=1; i < arguments.length; i++) file.append(arguments[i])
    return file;
}
/**
 * Utility function which returns file uri for a correspoding file.
 * @param {nsIFile}         file / dir path
 * @param String            corresponding file uri (file:///foo/bar)
 */
function getFileUri(file) {
    return Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService)
        .getProtocolHandler('file').QueryInterface(Ci.nsIFileProtocolHandler)
        .getURLSpecFromFile(file);
}
/**
 * XPCOM handles command line argument -narwhal. If argument is followed by
 * value it will be used as a path to the bootstarp.js, Otherwise looks for
 * ENV variable NARWHAL_HOME and if' its defined looks for narwzilla platform
 * and uses it's bootstrap.js to load.
 */
function CommandLineBoot() {}
CommandLineBoot.prototype = {
    classDescription: 'Narwhal boot from command line',
    classID: Components.ID("{8082de70-034e-444f-907f-a79543016e7c}"),
    contractID: '@narwhaljs.org/narwzilla/boot/command-line;1',
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsICommandLineHandler]),
    _xpcom_categories: [{ category: "command-line-handler" }],
    handle: function(cmdLine) {
        var bootstrap;
        // trying to get passed bootstrap.js (narwhal-narwzilla will pass it)
        try { bootstrap = getFile(cmdLine.handleFlagWithParam('narwhal', false)); } catch (e) {}
        // trying to read NARWHAL_HOME env variable
        if (!bootstrap && cmdLine.handleFlag('narwhal', false)) {
            try {
            var path = Env.get('NARWHAL_HOME');
            bootstrap = getFile(path, 'platforms', 'narwzilla', 'bootstrap.js');
            } catch(e) {}
        }
        if (bootstrap && bootstrap.exists()) {
            try {
                Loader.loadSubScript(getFileUri(bootstrap), Narwhal.prototype.__proto__);
            } catch(e) {
                dump('narwzilla> Error:' + e.message + '\nStack:' + e.stack + '\n');
            }
        }
    },
    helpInfo: '-narwhal [path]             Bootstrap narwhal\nwill boot narwhal from the bootstar path. If not specified will look for ENV variable NARWHAL_HOME'
}
/**
 * Instance of Narwhal for simulateing of a singleton object.
 * This is required, because we're registered for the 'JavaScript global
 * privileged property' category, whose handler always calls createInstance.
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
    classDescription: 'Narwhal',
    classID: Components.ID('{d438150e-51a2-4f45-9de9-619f5ab01a90}'),
    contractID: '@narwhaljs.org/narwzilla/global;1',
    QueryInterface: XPCOMUtils.generateQI(Narwhal.Interfaces),
    _xpcom_categories: [{
        // http://mxr.mozilla.org/seamonkey/source/dom/public/nsIScriptNameSpaceManager.h
        category: 'JavaScript global privileged property',
        entry: 'global'
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

function System() {};
System.Interfaces = [Ci.nsISupports, Ci.nsIClassInfo, Ci.nsIVariant];
System.prototype = {
    classDescription: 'ServerJS system',
    classID: Components.ID('{24e704fe-615d-7440-bcea-847795368b9e}'),
    contractID: '@narwhaljs.org/narwzilla/system;1',
    QueryInterface: XPCOMUtils.generateQI(System.Interfaces),
    _xpcom_categories: [
        {
        // http://mxr.mozilla.org/seamonkey/source/dom/public/nsIScriptNameSpaceManager.h
        category: 'JavaScript global privileged property',
        entry: 'system'
        }
    ],
    implementationLanguage: Ci.nsIProgrammingLanguage.JAVASCRIPT,
    getHelperForLanguage: function(number) null,
    _xpcom_factory: {
        createInstance: function(outer, iid) {
            if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;
            var system = {test: 'success'};
            system.__proto__ = System.prototype;
            system.QueryInterface(iid);
            dump(system.test);
            return system;
        }
    },
    getInterfaces: function(number) {
        number.value = System.Interfaces.length;
        return System.Interfaces;
    }
};

var components = [CommandLineBoot, Narwhal];
function NSGetModule(compMgr, fileSpec) XPCOMUtils.generateModule(components);
