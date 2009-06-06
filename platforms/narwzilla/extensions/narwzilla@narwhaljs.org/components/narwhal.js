const Cc = Components.classes;
const Ci = Components.interfaces;

const Loader = Cc['@mozilla.org/moz/jssubscript-loader;1'].getService(Ci.mozIJSSubScriptLoader);
const Env = Cc['@mozilla.org/process/environment;1'].getService(Ci.nsIEnvironment);

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');


function getFile(path) {
    var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
    file.initWithPath(path);
    for (var i=1; i < arguments.length; i++) file.append(arguments[i])
    return file;
}
function getFileUri(file) {
    return Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService)
        .getProtocolHandler('file').QueryInterface(Ci.nsIFileProtocolHandler)
        .getURLSpecFromFile(file);
}
// "{24e704fe-615d-7440-bcea-847795368b9e}"),

var narwhal;
function Narwhal() {};
Narwhal.Interfaces = [Ci.nsISupports, Ci.nsICommandLineHandler, Ci.nsIClassInfo, Ci.nsINarwhal];
Narwhal.prototype = {
    classDescription: 'Narwhal',
    classID: Components.ID('{d438150e-51a2-4f45-9de9-619f5ab01a90}'),
    contractID: '@narwhaljs.org/narwzilla/narwhal;1',
    QueryInterface: XPCOMUtils.generateQI(Narwhal.Interfaces),
    _xpcom_categories: [
        { category: "command-line-handler" },
        {
        // http://mxr.mozilla.org/seamonkey/source/dom/public/nsIScriptNameSpaceManager.h
        category: 'JavaScript global privileged property',
        entry: 'Narwhal'
        }
    ],
    implementationLanguage: Ci.nsIProgrammingLanguage.JAVASCRIPT,
    getHelperForLanguage: function(number) null,
    _xpcom_factory: {
        createInstance: function(outer, iid) {
            if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;
            if (!narwhal) narwhal = new Narwhal();
            narwhal.QueryInterface(iid);
            return narwhal;
        }
    },
    getInterfaces: function(number) {
        number.value = Narwhal.Interfaces.length;
        return Narwhal.Interfaces;
    },
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
                Loader.loadSubScript(getFileUri(bootstrap), this);
            } catch(e) {
                dump('narwzilla> Error:' + e.message + '\nStack:' + e.stack + '\n');
            }
        }
    },
    helpInfo: '-narwhal              Starts narwhal\n'
};

var components = [Narwhal];
function NSGetModule(compMgr, fileSpec) XPCOMUtils.generateModule(components);
