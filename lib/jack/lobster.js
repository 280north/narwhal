require("../jack");

Jack.Lobster = function(something) {
    this.something = something;
    this.count = 0;
};

Jack.Lobster.prototype.invoke = function(env) {
    var res = new Jack.Response(null, 200, {"Transfer-Encoding" : "chunked", "Content-Type":"text/plain"});
    //res.write("<pre>hello "+ this.something +", you are the " + (this.count++) + " visitor</pre>");
    
    res.body = { each : function(block) {
        for (var i = 0; i < 100; i++) {
            block("hello"+i);
            java.lang.Thread.currentThread().sleep(100);
        }
    }};
    
    return res.finish();
}
