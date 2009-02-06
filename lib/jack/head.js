var Head = exports.Head = function(app) {
    this.app = app;
}

Head.prototype.invoke = function(env) {
    var result = this.app.invoke(env),
        status = result[0], headers = result[1], body = result[2];
        
    if (env["REQUEST_METHOD"] === "HEAD")
        return [status, headers, []];
    else
        return [status, headers, body];
}
