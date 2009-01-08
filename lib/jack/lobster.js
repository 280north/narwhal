Jack.Lobster = function(something) {
    this.something = something;
    this.count = 0;
};

Jack.Lobster.prototype.call = function(env) {
    var req = new Jack.Request(env);
    var res = new Jack.Response();
    res.write("<pre>hello " + (this.something || "world") + "!"+(this.count++)+"</pre>");
    
    return res.finish();
}
