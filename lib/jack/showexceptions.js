var ShowExceptions = exports.ShowExceptions = function(app) {
    return function(env) {
        try {
            return app(env);
        } catch (e) {
            var backtrace = String((e.rhinoException && e.rhinoException.printStackTrace()) || (e.name + ": " + e.message));
            return [500, {"Content-Type":"text/html","Content-Length":String(backtrace.length)}, backtrace];
        }
    }
}
