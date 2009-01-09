Jack.ShowExceptions = function(app) {
    this.app = app;
}

Jack.ShowExceptions.prototype.call = function(env) {
    try
    {
        return this.app.call(env);
    } catch (e) {
        var backtrace = String((e.rhinoException && e.rhinoException.printStackTrace()) || (e.name + ": " + e.message));
        return [500, new Hash({"Content-Type":"text/html","Content-Length":String(backtrace.length)}), backtrace];
    }
}
