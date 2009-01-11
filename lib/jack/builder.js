require("../jack");

Jack.Builder = function(block) {
    this.ins = [];
    if (block)
        block.apply(this, []);
}

Jack.Builder.app = function(block) {
    return new this(block).to_app();
}

Jack.Builder.prototype.use = function(middleware, args, block) {
    this.ins.push({ invoke : function(app) { return new middleware(app, args, block); }});
}

Jack.Builder.prototype.run = function(app) {
    this.ins.push(app);
}

Jack.Builder.prototype.map = function(path, block) {
    // check to see if the last element is a url mapping. if not, push one
    var last = this.ins[this.ins.length-1];
    if (!last || last.constructor !== Object || last.invoke) // FIXME: is this ambiguous?
        this.ins.push({});
        
    // set the path
    this.ins[this.ins.length-1][path] = new this.constructor(block).to_app();
}

Jack.Builder.prototype.to_app = function() {
    // if the last object is a Object, first convert it to a URLMap
    var last = this.ins[this.ins.length-1];
    if (last.constructor === Object && !last.invoke) // FIXME: is this ambiguous?
        this.ins[this.ins.length-1] = new Jack.URLMap(last);
        
    // get the final app so we can provide it to inject
    var inner_app = this.ins[this.ins.length-1];
    
    // apply each subsequent app to the stack
    return this.ins.slice(0,-1).reverse().inject(function(a,e) { return e.invoke(a); }, inner_app);
}

Jack.Builder.prototype.invoke = function(env) {
    // convert the array of callable's to an app and call it
    return this.to_app().invoke(env);
}
