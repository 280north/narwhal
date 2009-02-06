var Utils = require("utils");

// Sets the Content-Length header on responses with fixed-length bodies.
var ContentLength = exports.ContentLength = function(app) {
    this.app = app;
}

ContentLength.prototype.invoke = function(env) {
    var result = this.app.invoke(env),
        status = result[0], headers = result[1], body = result[2];
    
    if (!Utils.STATUS_WITH_NO_ENTITY_BODY(status) &&
        !HashP.includes(headers, "Content-Length") &&
        !(HashP.includes(headers, "Transfer-Encoding") && HashP.get(headers, "Transfer-Encoding") !== "indentity") && 
        typeof body.each === "function")
    {
        var newbody = [];
        body.each(function(part) { newbody.push(part); });
        body = newbody.join("");
        
        HashP.set(headers, "Content-Length", String(body.length));
    }
    return [status, headers, body];
}
