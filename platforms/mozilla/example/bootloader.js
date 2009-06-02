
/**
 * This bootloader will load Narwhal into a mozilla extension.
 * 
 * It optionally waits for Firebug's TraceConsole to be available.
 * 
 * Simply include this file in your overlay.xml file:
 * 
 *   <script src="chrome://<APP>/content/bootloader.js" type="application/x-javascript"/>
 * 
 */

(function() {

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const EM = Cc["@mozilla.org/extensions/manager;1"].getService(Ci.nsIExtensionManager);

  var global = this;
  
  
  
  // ******************************
  // ***** Make changes below *****
  // ******************************

  // TODO: Determine these based on preferences
  var logToFirebugTraceConsole = true;
  var waitForFirebugTraceConsole = true;
  
  var ID = "org.firewidgets.apps.mozilla.Extension@id.christophdorn.com";  // Extension ID
  var pref_domain = "extensions.firewidgets";  // Extension preferences domain
  
  var TraceConsole = function() { if(!logToFirebugTraceConsole) return false; try { return Cc["@joehewitt.com/firebug-trace-service;1"].getService(Ci.nsISupports).wrappedJSObject.getTracer(pref_domain); } catch(e) {}; return false; };

  var bootloader = {
    "args": ['runtest'],
    "path": {
      "narwhal": "lib/narwhal", // Path relative to extension root
      "lib": [
        "lib/test"
      ] // Additional library paths relative to extension root
    },
    "platform": {
      "mozilla": {
        "debug": false,
        "extension": {
          "id": ID
        },
        "print": function(string){
          if (logToFirebugTraceConsole) {
            try {
              TraceConsole().dump(pref_domain, string, string);
            } 
            catch (e) {
              dump("narwhal: " + string);
            }
          }
          else {
            dump("narwhal: " + string);
          }
        }
      }
    }
  };
  
  // ******************************
  // ***** Make changes above *****
  // ******************************

  function loadFile(path) {
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
  }
    
  function boot() {
    with (this) {
      try {
        eval(loadFile(bootloader.path.narwhal + "/platforms/mozilla/bootstrap.js"));
      } catch(e) {
        // TODO: Fix line numbering
        bootloader.platform.mozilla.print(e);
      }
    }      
  }

  function Loader()
  {
    var self = this;
    this.boot = function() {
      if(waitForFirebugTraceConsole) {
        this.attachListener();
      } else {
        this.load();
      }
    }
    this.traceConsoleListener = {
      onLoadConsole: function(win, rootNode) {
        self.load();
      }
    };
    this.load = function() {
      boot();
    };
    this.attachListener = function () {
      try {
        Firebug.TraceModule.addListener(self.traceConsoleListener);
      } catch(e){
        setTimeout(function() { self.attachListener(); }, 100);
      }
    };
  }
  
  // Boot the system
  new Loader().boot();

})();
