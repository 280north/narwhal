require("../jack");

Jack.ShowExceptions = function(app) {
    this.app = app;
}

Jack.ShowExceptions.prototype.invoke = function(env) {
    try
    {
        return this.app.invoke(env);
    } catch (e) {
        var backtrace = String((e.rhinoException && e.rhinoException.printStackTrace()) || (e.name + ": " + e.message));
        return [500, {"Content-Type":"text/html","Content-Length":String(backtrace.length)}, backtrace];
    }
}
