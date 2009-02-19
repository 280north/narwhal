/**
 * Cascade tries an request on several apps, and returns the first response 
 * that is not 404.
 */
var Cascade = exports.Cascade = function(apps, status) {

    this.apps = apps;
    this.status = status || 404;

    return function(env) {
        for (var i = 0; i < apps.length; i++) {
            var resp = apps[i](env);
            if (resp[0] != this.status) {
                return resp;
            }
        }
    }

}
