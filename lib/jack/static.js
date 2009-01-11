require("../jack");

Jack.Static = function(app, options) {
    var options = options || {};
    
    this.app = app;
    this.urls = options["urls"] || ["/favicon.ico"];
    
    root = options["root"] || Dir.pwd();
    this.file_server = new Jack.File(root);
}

Jack.Static.prototype.invoke = function(env) {
    var path = env["PATH_INFO"];
    
    if (this.urls.any(function(url) { return path.indexOf(url) === 0; }))
        return this.file_server.invoke(env);
    else
        return this.app.invoke(env);
        
}
