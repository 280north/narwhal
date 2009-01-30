require("../jack");

Jack.Lobster = function(something) {
    this.something = something;
    this.count = 0;
};

Jack.Lobster.prototype.invoke = function(env) {
    var res = new Jack.Response(null, 200, {"Content-Type":"text/html"});
    
    res.write("<pre>hello "+ this.something +", you are the " + (this.count++) + " visitor</pre>");
    
    return res.finish();
}
