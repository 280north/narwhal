require("../jack");

// Sets the Content-Length header on responses with fixed-length bodies.
Jack.ContentLength = function(app) {
    return function(env) {
        var result = app(env),
            status = result[0], headers = result[1], body = result[2];

        if (!Jack.Utils.STATUS_WITH_NO_ENTITY_BODY(status) &&
            !HashP.includes(headers, "Content-Length") &&
            !(HashP.includes(headers, "Transfer-Encoding") && HashP.get(headers, "Transfer-Encoding") !== "indentity") && 
            typeof body.forEach === "function")
        {
            var newbody = [];
            body.forEach(function(part) { newbody.push(part); });
            body = newbody.join("");

            HashP.set(headers, "Content-Length", String(body.length));
        }
        return [status, headers, body];
    }
}
