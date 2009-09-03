
var IO = require("io").IO,
    HashP = require("hashp").HashP,
    engine = require("http-client-engine");


exports.HTTPClient = HTTPClient;

var newTransactionId = (function () {
    var id = 0;
    return function () {
        return id ++;
    };
})();
var transaction = (function () {
    var hidden = {};
    return function (id, del) {
        if (del) {
            delete hidden[id];
            return;
        }
        if (!hidden.hasOwnProperty(id)) hidden[id] = {};
        return hidden[id];
    };
})();


// {method, url, headers, body}
// return value is {status:status, headers:{..}, body:[..]}
function HTTPClient (settings) {
    if (!(this instanceof HTTPClient)) return new HTTPClient(settings);
    if (!this.txId) {
        // new object.  set up defaults.
        this.txId = newTransactionId();
        this.set({
            "method" : "GET",
            "headers" : {
                "X-Requested-With" : "CommonJS HTTP Client"
            },
            "body" : []
        });        
    }
    if (settings) this.set(settings);
};

HTTPClient.prototype = {
    set : function HTTPClient_set (settings) {
        if (arguments.length === 2) {
            var s = {};
            s[arguments[0]] = arguments[1];
            return this.set(s);
        }
        var guts = transaction(this.txId);
        if (("headers" in settings)) {
            if (typeof settings.headers !== 'object') throw new Error(
                "HTTPClient: headers must be a simple object."
            );
            this.setHeaders(settings.headers);
            delete settings.headers;
        }
        if (("body" in settings) && typeof settings.body.forEach !== 'function') {
            throw new Error("HTTPClient: body must be iterable.");
        }
        for (var i in settings) if (settings.hasOwnProperty(i)) {
            HashP.set(guts, i, settings[i]);
        }
        return this;
    },
    setHeaders : function HTTPClient_setHeaders (headers) {
        for (var h in headers) if (headers.hasOwnProperty(h)) {
            this.setHeader(h, headers[h]);
        }
        return this;
    },
    setHeader : function HTTPClient_setHeader (key, val) {
        // set the request header.
        var guts = transaction(this.txId);
        if (!guts.hasOwnProperty("headers")) guts.headers = {};
        HashP.set(guts.headers, key, val);
        return this;
    },
    write : function HTTPClient_write (data) {
        var guts = transaction(this.txId);
        var len = HashP.get(guts.headers, "Content-Length") || 0;
        len += data.length;
        HashP.set(guts.headers, "Content-Length", len);
        guts.body.push(data);
        return this;
    },
    connect : function HTTPClient_connect () {
        engine.connect(transaction(this.txId));
        return this;
    },
    read : function HTTPClient_read (decode) {
        var guts = transaction(this.txId);
        var resp = engine.read(transaction(this.txId));
        if (decode) HTTPClient.decode(resp);
        // cleanup
        transaction(this.txId, true);
        return resp;
    },
    finish : function HTTPClient_finish (decode) {
        return this.connect().read(decode);
    }
};
HTTPClient.decode = function HTTPCLient_decode (resp) {
    var encoding = HashP.get(resp.headers, "Content-Encoding");
    if (!encoding) {
        var contentType = HashP.get(resp.headers, "Content-Type");
        if (contentType) {
            encoding = /charset=([^;\s]+)/.exec(contentType)[1];
        }
    }
    // fall back on UTF-8. It's almost always a good choice.
    if (!encoding) encoding = 'UTF-8';
    var raw = resp.body;
    resp._rawBody = raw;
    resp.body = {forEach : function (block) {
        raw.forEach(function (i) {
            block(i.decodeToString(encoding));
        });
    }};
    return resp;
};
HTTPClient.undecode = function HTTPClient_undecode (resp) {
    if ("_rawBody" in resp) resp.body = resp._rawBody;
    delete resp._rawBody;
    return resp;
};