EXPORTED_SYMBOLS = ["Repl"];

const Cc = Components.classes;
const Ci = Components.interfaces;

function log(msg) dump(msg + '\n');

var Repl = {
    /**
     * Session manager
     * Can have several connections. This is object to maintain sessions.
     * @type Object
     */
    sessions : {
        /**
         * Collection of the open sessions
         * @type Array
         */
        _list: {},
        /**
         * Add new session
         * @param {Session} session 
         */
        add: function(key, session) {
            if (!(key in this._list) ){
                this._list[key] = session;
            }
            return this._list[key];
        },
        /**
         * Remove sesson
         * @param session {Session}
         */
        remove: function(sessionOrKey) {
            if (typeof sessionOrKey == "string") {
                delete this._list[sessionOrKey];
                return;
            }
            for (var key in this._list){
                if ( this._list[key] == sessionOrKey ){
                    delete this._list[key];
                    break;
                }
            }
        },
        /**
         * Get session by index
         * @param {Number} index
         */
        get: function(key) {
            return this._list[key];
        },
        /**
         * Quits all sessions
         */
        quit: function() {
            for each (session in this._list){
                session.stop();
            }
        }
    },
    /**
     * Starts listening to the specified port.
     * @param {Number} port     port to listen
     */
    start: function() {
        try {
            server = Cc['@mozilla.org/network/server-socket;1'].createInstance(Ci.nsIServerSocket);
            server.init(port, pref.getBoolPref('loopbackOnly'), -1);
            server.asyncListen(this);
            log('Listening...');
        } catch(e) {
            log('Exception: ' + e);
        }
    },
    onSocketAccepted: function(serv, transport) {
        try {
            var outstream = transport.openOutputStream(Ci.nsITransport.OPEN_BLOCKING , 0, 0);
            var stream = transport.openInputStream(0, 0, 0);
            var instream = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
            instream.init(stream, 'UTF-8', 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
        } catch(e) {
            log('Error: ' + e);
        }
        log('Accepted connection.');
    
        var window = Cc['@mozilla.org/appshell/window-mediator;1']
            .getService(Ci.nsIWindowMediator)
            .getMostRecentWindow('');
    
        var session = new REPL();
        session.onOutput = function(string) outstream.write(string, string.length);
        session.onQuit = function() {
            instream.close();
            outstream.close();
            sessions.remove(session);
        };
        session.init(window);
    
        var pump = Cc['@mozilla.org/network/input-stream-pump;1'].createInstance(Ci.nsIInputStreamPump);
        pump.init(stream, -1, -1, 0, 0, false);
        pump.asyncRead({
            onStartRequest: function(request, context) {},
            onStopRequest: function(request, context, status) session.quit(),
            onDataAvailable: function(request, context, inputStream, offset, count) {
                var str = {}
                instream.readString(count, str)
                session.receive(str.value);
            }
        }, null);
        sessions.add(session);
    }
}


/**
 * Constructor of socket connections.
 * @param host {String}
 * @param port {String}
 * @param session {Session} session that will use this socket
 */
var Socket = function(host, port, session) {
    var socket = this;
    // Trasnport
    var transport = this.transportService.createTransport(null, 0, host, port, null);
    // OutStrem
    this.outstream = transport.openOutputStream(0 , 0, 0);
    // InStrema
    stream = transport.openInputStream(0, 0, 0);
    this.instream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
    this.instream.init(stream, 'UTF-8', 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
    var pump = Cc["@mozilla.org/network/input-stream-pump;1"].createInstance(Ci.nsIInputStreamPump);
    pump.init(stream, -1, -1, 0, 0, false);
    pump.asyncRead({
        data : "",
        onStartRequest: function(request, context) session.onStart(),
        onStopRequest: function(request, context, status) {
            socket.instream.close();
            socket.outstream.close();
            session.onStop(this.data);
            this.data = "";
        },
        onDataAvailable: function(request, context, inputStream, offset, count) {
            this.data += socket.instream.read(count);
            
            if (this.data.search(/<response[\s\S]*<\/response>/mg) > -1) {
                var response = this.data.match(/<response[\s\S]*<\/response>/mg)[0];
                this.data = this.data.replace(response, "");
                session.onResponse(response);
            }
        }
    }, null);
};

Socket.prototype = {
    /**
     * Socket transport service
     * @type {nsISocketTransportService}
     */
    transportService : Cc["@mozilla.org/network/socket-transport-service;1"].getService(Ci.nsISocketTransportService),
    
    /**
     * Input Stream
     * @type {nsIScriptableInputStream}
     */
    instream : null,
    
    /**
     * Output Stream
     * @type {??}
     */
    outstream : null,
    
    /**
     * Pushes the data to the remote host
     * In our case to the repl
     */
    push : function(data) {
        this.outstream.write(data, data.length);
    }
};
