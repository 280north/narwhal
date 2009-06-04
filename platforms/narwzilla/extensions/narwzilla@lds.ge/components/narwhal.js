const Cc = Components.classes;
const Ci = Components.interfaces;

const Loader = Cc['@mozilla.org/moz/jssubscript-loader;1'].getService(Ci.mozIJSSubScriptLoader);

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function filePathToUri(path) {
    var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
    file.initWithPath(path);
    return Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService)
        .getProtocolHandler('file').QueryInterface(Ci.nsIFileProtocolHandler)
        .getURLSpecFromFile(file);
}

function Handler() {}
Handler.prototype = {
    classDescription: "narwhal command line argument handler",
    classID:          Components.ID("{24e704fe-615d-7440-bcea-847795368b9e}"),
    contractID:       "@mozilla.org/commandlinehandler/general-startup;1?type=narwhal",
    QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsICommandLineHandler, Ci.nsIFactory, Ci.nsISupports]),

    _xpcom_categories: [{ category: "command-line-handler" }],


    handle: function(cmdLine) {
        var params;
        try {
            params = cmdLine.handleFlagWithParam('narwhal', false);
        } catch (e) {}
        
        if (params || cmdLine.handleFlag('narwhal', false))
            try {
                var sandbox = {};
                Loader.loadSubScript(filePathToUri(params), sandbox);
                dump('narwzilla>' + typeof sandbox.system);
            } catch(e) {
                dump('narwzilla> Error:' + e.message + '\n');
                dump('narwzilla> Stack:' + e.stack + '\n');
            }
    },
    helpInfo: '-narwhal              Starts narwhal shell.\n'
};

var components = [Handler];
function NSGetModule(compMgr, fileSpec) {
    return XPCOMUtils.generateModule(components);
}
