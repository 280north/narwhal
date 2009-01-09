Jack.Lobster = function(something) {
    this.something = something;
    this.count = 0;
};

Jack.Lobster.prototype.call = function(env) {
    var req = new Jack.Request(env);
    
    var res = new Jack.Response(/*null, 200, new Hash({"Transfer-Encoding" : "chunked"})*/);
    
    res.write("<pre>hello " + (this.something || "world") + "!"+(this.count++)+"</pre>");
    
     //throw new Error("bahhhhhh");
    
    var result = res.finish();
    //
    //result.body = { each : function(block) {
    //    for (var i = 0; i < 10; i++) {
    //        block("hello"+i);
    //        java.lang.Thread.currentThread().sleep(1000);
    //    }
    //}}
    
    return result;
}
