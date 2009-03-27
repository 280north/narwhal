var Request = require("./request").Request,
    HashP = require("hashp").HashP;

// Wraps a response in a JavaScript callback if provided in the "callback" parameter,
// JSONP style, to enable cross-site fetching of data. Be careful where you use this.
// http://bob.pythonmac.org/archives/2005/12/05/remote-json-jsonp/
var JSONP = exports.JSONP = function(app) {
    return function(env) {
        var result = app(env),
            request = new Request(env);
            
        var callback = request.params("callback");
        
        if (callback) {
            var body = result[2];
        
            HashP.set(result[1], "Content-Type", "application/javascript");
            
            result[2] = { forEach : function(block) {
                block(callback+"(");
                body.forEach(block);
                block(")");
            }};
        }
        return result;
    }
}
