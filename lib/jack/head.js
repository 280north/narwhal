var Head = exports.Head = function(app) {
    return function(env) {
        var result = app(env),
            status = result[0], headers = result[1], body = result[2];

        if (env["REQUEST_METHOD"] === "HEAD")
            return [status, headers, []];
        else
            return [status, headers, body];
    }
}
