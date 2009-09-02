
var IO = require("io").IO,
    HashP = require("hashp").HashP,
    engineFinish = require("http-client-engine").finish;


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
    
    this.txId = newTransactionId();
    var guts = transaction(this.txId);
    
    HashP.set(guts, "method", "GET");
    HashP.set(guts, "headers", {});
    HashP.set(guts, "body", []);
    
    if (("body" in settings) && typeof settings.body.forEach !== 'function') {
        throw new Error("HTTPClient: body must be iterable.");
    }
    
    this.setHeader("X-Requested-With", "CommonJS HTTP Client");
    if (("headers" in settings)) {
        if (typeof settings.headers !== 'object') throw new Error(
            "HTTPClient: headers must be a simple object."
        );
        this.setHeaders(settings.headers);
        delete settings.headers;
    }
    
    for (var i in settings) if (settings.hasOwnProperty(i)) {
        HashP.set(guts, i, settings[i]);
    }
};

HTTPClient.prototype = {
    setHeaders : function (headers) {
        for (var h in headers) if (headers.hasOwnProperty(h)) {
            this.setHeader(h, headers[h]);
        }
        return this;
    },
    setHeader : function (key, val) {
        // set the request header.
        var guts = transaction(this.txId);
        HashP.set(guts.headers, key, val);
        return this;
    },
    write : function (data) {
        var guts = transaction(this.txId);
        var len = HashP.get(guts.headers, "Content-Length") || 0;
        len += data.length;
        HashP.set(guts.headers, "Content-Length", len);
        guts.body.push(data);
        return this;
    },
    finish : function (decode) {
        var guts = transaction(this.txId);
        var resp = engineFinish(transaction(this.txId));
        if (decode) HTTPClient.decode(resp);
        // cleanup
        transaction(this.txId, true);
        return resp;
    }
};
HTTPClient.decode = function (resp) {
    var encoding = HashP.get(resp.headers, "Content-Encoding");
    if (!encoding) {
        encoding = HashP.get(resp.headers, "Content-Type");
        if (encoding) {
            encoding = encoding.split(";");
            encoding.shift();
            encoding = encoding.shift();
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
HTTPClient.unDecode = function (resp) {
    if ("_rawBody" in resp) resp.body = resp._rawBody;
    delete resp._rawBody;
    return resp;
};