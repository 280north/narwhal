require("../jack");

Jack.CommonLogger = function(app, logger) {
    return function(env) {
        return (new Jack.CommonLogger.Context(app, logger)).run(env);
    }
}

Jack.CommonLogger.Context = function(app, logger) {
    this.app = app;
    this.logger = logger || this;
}

Jack.CommonLogger.Context.prototype.run = function(env) {
    this.env = env;
    this.time = new Date();
    
    var result = this.app(env);

    this.status  = result[0];
    this.headers = result[1];
    this.body    = result[2];

    result[2] = this;

    return result;
}

Jack.CommonLogger.Context.prototype.log = function(string) {
    this.env["jack.errors"].write(string+"\n");
    this.env["jack.errors"].flush();
}

Jack.CommonLogger.Context.prototype.forEach = function(block) {
    var length = 0;
    
    this.body.forEach(function(part) {
        length += part.length;
        block(part);
    });

    var now = new Date();

    // Common Log Format: http://httpd.apache.org/docs/1.3/logs.html#common
    // lilith.local - - [07/Aug/2006 23:58:02] "GET / HTTP/1.1" 500 -
    //             %{%s - %s [%s] "%s %s%s %s" %d %s\n} %
    
    var address     = this.env['HTTP_X_FORWARDED_FOR'] || this.env["REMOTE_ADDR"] || "-",
        user        = this.env["REMOTE_USER"] || "-",
        timestamp   = now.toString(), // FIXME @now.strftime("%d/%b/%Y %H:%M:%S"),
        method      = this.env["REQUEST_METHOD"],
        path        = this.env["PATH_INFO"],
        query       = !this.env["QUERY_STRING"] ? "" : "?"+this.env["QUERY_STRING"],
        version     = this.env["HTTP_VERSION"],
        status      = this.status.toString().substring(0,3),
        size        = length === 0 ? "-" : length.toString(),
        duration    = now.getTime() - this.time.getTime();
    
    this.logger.log(address+' - '+user+' ['+timestamp+'] "'+method+' '+path+query+' '+version+'" '+status+' '+size+' '+duration);
}
