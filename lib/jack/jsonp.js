require("../jack");

Jack.JSONP = function(app) {
    return function(env) {
        var result = app(env),
            request = new Jack.Request(env);
            
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