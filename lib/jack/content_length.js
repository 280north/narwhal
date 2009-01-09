// Sets the Content-Length header on responses with fixed-length bodies.
Jack.ContentLength = function(app) {
    this.app = app;
}

Jack.ContentLength.prototype.call = function(env) {
    var result = this.app.call(env),
        status = result[0], headers = result[1], body = result[2];
    
    if (!Jack.Utils.STATUS_WITH_NO_ENTITY_BODY(status) &&
        !headers.includes("Content-Length") &&
        !(headers.includes("Transfer-Encoding") && headers.get("Transfer-Encoding") !== "indentity") && 
        typeof body.each === "function")
    {
        var newbody = [];
        body.each(function(part) { newbody.push(part); });
        body = newbody.join("");
        
        headers.set("Content-Length", String(body.length));
    }
    return [status, headers, body];
}
