Jack.Builder = function(block) {
    this.ins = [];
    if (block)
        block.apply(this, []);
}

Jack.Builder.app = function(block) {
    print(this + "," + this == Jack.Builder);
    return new this(block).to_app();
}

Jack.Builder.prototype.use = function(middleware, args, block) {
    this.ins.push({ call: function(app) { return new middleware(app, args, block); }});
}

Jack.Builder.prototype.run = function(app) {
    this.ins.push(app);
}

Jack.Builder.prototype.map = function(path, block) {
    var last = this.ins[this.ins.length-1];
    if (last && last.constructor === Hash)
    {
        last.set(path, new this.constructor(block).to_app());
    }
    else
    {
        this.ins.push(new Hash());
        this.map(path, block);
    }

}

Jack.Builder.prototype.to_app = function() {
    // if the last object is a Hash (as created by "map"), first convert it to a URLMap
    var last = this.ins[this.ins.length-1];
    if (last.constructor === Hash)
        this.ins[this.ins.length-1] = new Jack.URLMap(last);
        
    // get the final app we can provide it to inject
    var inner_app = this.ins[this.ins.length-1];
    
    // apply each subsequent app to the stack
    return this.ins.slice(0,-1).reverse().inject(function(a,e) { return e.call(a); }, inner_app);
}

Jack.Builder.prototype.call = function(env) {
    // convert the array of callable's to an app and call it
    return this.to_app().call(env);
}
