var CommonLogger = exports.CommonLogger = function(app, logger) {
    return function(env) {
        return (new CommonLogger.Context(app, logger)).run(env);
    }
}

CommonLogger.Context = function(app, logger) {
    this.app = app;
    this.logger = logger || this;
}

CommonLogger.Context.prototype.run = function(env) {
    this.env = env;
    this.time = new Date();
    
    var result = this.app(env);

    this.status  = result[0];
    this.headers = result[1];
    this.body    = result[2];

    result[2] = this;

    return result;
}

CommonLogger.Context.prototype.log = function(string) {
    this.env["jack.errors"].puts(string);
    this.env["jack.errors"].flush();
}

CommonLogger.Context.prototype.forEach = function(block) {
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
        timestamp   = CommonLogger.formatDate(now),
        method      = this.env["REQUEST_METHOD"],
        path        = (this.env["SCRIPT_NAME"]||"") + (this.env["PATH_INFO"]||""),
        query       = this.env["QUERY_STRING"] ? "?"+this.env["QUERY_STRING"] : "",
        version     = this.env["HTTP_VERSION"],
        status      = String(this.status).substring(0,3),
        size        = length === 0 ? "-" : length.toString(),
        duration    = now.getTime() - this.time.getTime();
    
    var stringToLog = address+' - '+user+' ['+timestamp+'] "'+method+' '+path+query+' '+version+'" '+status+' '+size
    //stringToLog += ' '+duration;
    
    this.logger.log(stringToLog);
}

CommonLogger.formatDate = function(date) {
    var d = date.getDate(),
        m = CommonLogger.MONTHS[date.getMonth()],
        y = date.getFullYear(),
        h = date.getHours(),
        mi = date.getMinutes(),
        s = date.getSeconds();
        
    // TODO: better formatting
    return (d<10?"0":"")+d+"/"+m+"/"+y+" "+
        (h<10?"0":"")+h+":"+(mi<10?"0":"")+mi+":"+(s<10?"0":"")+s;
}

CommonLogger.MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
