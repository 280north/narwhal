var Utils = require("./utils"),
    HashP = require("hashp").HashP;

// Sets the Content-Length header on responses with fixed-length bodies.
var ContentLength = exports.ContentLength = function(app) {
    return function(env) {
        var result = app(env),
            status = result[0], headers = result[1], body = result[2];

        if (!Utils.STATUS_WITH_NO_ENTITY_BODY(status) &&
            !HashP.includes(headers, "Content-Length") &&
            !(HashP.includes(headers, "Transfer-Encoding") && HashP.get(headers, "Transfer-Encoding") !== "identity") && 
            typeof body.forEach === "function")
        {
            var newBody = [],
                length = 0;
                
            body.forEach(function(part) {
                length += part.getLength();
                newBody.push(part);
            });
            
            body = newBody;

            HashP.set(headers, "Content-Length", String(length));
        }
        return [status, headers, body];
    }
}
