var Head = exports.Head = function(app) {
    return function(env) {
        var result = app(env);

        if (env["REQUEST_METHOD"] === "HEAD")
            result[2] = [];
            
        return result;
    }
}
