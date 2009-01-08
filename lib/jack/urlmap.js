Jack.URLMap = function(map) {
    if (!map.map)
        map = new Hash(map);
    
    this.mapping = map.map(function(location, app) {
        var match, host, location;
        if (match = location.match(/^https?:\/\/(.*?)(\/.*)/))
        {
            host = match[1];
            location = match[2];
        }
        else
            host = null;
            
        if (location.charAt(0) != "/")
            throw new Error("paths need to start with / (was: " + location + ")");
        
        location = location.chomp("/");
        
        return {host:host, location:location, app:app};
    }).sort(function(a, b) {
        return (b.location.length - a.location.length) || ((b.host||"").length - (a.host||"").length);
    });
    
    for (var i = 0; i < this.mapping.length; i++)
        print(this.mapping[i].location + " / " + this.mapping[i].host);
}

Jack.URLMap.prototype.call = function(env) {
    var path  = env["PATH_INFO"] ? env["PATH_INFO"].squeeze("/") : "",
        hHost = env['HTTP_HOST'], sName = env['SERVER_NAME'], sPort = env['SERVER_PORT'];
        
    // FIXME: better way to break out of the "each" than with an exception?
    try {
        this.mapping.each(function(r) {
            if ((r.host === hHost || r.host === sName || (r.host === null && (hHost === sName || hHost === sName+":"+sPort))) &&
                (r.location === path.substring(0, r.location.length)) &&
                (path.charAt(r.location.length) === "" || path.charAt(r.location.length) === "/"))
            {    
                env["SCRIPT_NAME"] += r.location;
                env["PATH_INFO"]    = path.substring(r.location.length);
                
                var result = r.app.call(env);
                
                throw { "result" : result };
            }
        });
    } catch (e) {
        if (!e.result)
            throw e;
        return e.result;
    }
    return {
        "status"    : 404,
        "headers"   : new Hash({"Content-Type" : "text/plain"}),
        "body"      : ["Not Found: " + path]
    };
}