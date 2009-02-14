var Request         = require("jack/request").Request,
    Response        = require("jack/response").Response,
    CommonLogger    = require("jack/commonlogger").CommonLogger,
    Jetty           = require("jack/handler/jetty").Jetty,
    Hash            = require("hash").Hash;

Roundabout = exports.Roundabout = function(roads, options) {
    this.options = Hash.merge(Roundabout.defaultOptions, options);
    this.roads = {};
    this.filters = [];
    
    if (isArray(roads)) {
        for (var i = 0; i < roads.length; i++)
            this.event(roads[i][0], roads[i][1], roads[i][2]);
    }
    else {
        for (var path in roads)
            this.event("*", path, roads[path]);
    }
    
    if (this.options.longestMatchFirst)
        this.sortMapping();
        
    return this.invoke;
}

// Jack compatible invoke method. Pushes/pops the Roundabout context from the Jack environment. Cleans up non-Jack compatible responses.
Roundabout.prototype.invoke = function(env) {
    // push a new context
    var context = new Roundabout.Context(env, new Request(env), new Response());
    Roundabout._pushContext(env, context);
    
    var result = this.dispatch(env),
        response;
    
    // if the returned result is Rack compatible, use that as the result
    if (isArray(result) && result.length === 3) {
        response = result;
    }
    // otherwise use the response in the Roundabout context
    else {
        if (result && result.forEach)
            context.response.body = result; // if the result wasn't null/empty make it the body
        else if (context.body && context.body.forEach)
            context.response.body = context.body; // if the user sets "this.body"
        
        response = context.response.finish();
    }
    
    Roundabout._popContext(env);
    
    return response;
}

// Dispatcher. checks request against registered events and dispatches appropriately
Roundabout.prototype.dispatch = function(env) {
    var method = env["REQUEST_METHOD"].toUpperCase(),
        roads = this.roads[method];
    
    var path  = env["PATH_INFO"] ? env["PATH_INFO"].squeeze("/") : "",
        hHost = env['HTTP_HOST'], sName = env['SERVER_NAME'], sPort = env['SERVER_PORT'];
    
    if (roads) {    
        var context = env["roundabout.context"];
        
        for (var i = 0; roads && i < roads.length; i++) {
            var road = roads[i],
                regex = this.options.caseSensitive ? road.regex : road.iregex,
                wildcardMatches;
            
            if ((wildcardMatches = path.match(regex)) && (!road.options.filter || road.options.filter.apply(context, [env, context]))) {
                
                for (var j = 0; j < road.wildcards.length; j++)
                    context.wildcards[road.wildcards[j]] = wildcardMatches[j+1];
                    
                //env["SCRIPT_NAME"] += location;
                //env["PATH_INFO"]    = path.substring(location.length);
                
                return road.app.apply(context, [env, context]);
            }
        }
    }
    
    return [404, {"Content-Type" : "text/plain"},  "Not Found*: "+path];
}

// Main event registration API. other APIs call this one
Roundabout.prototype.event = function(method, path, app, options) {
    var road = {
        options     : options || {},
        app         : app,
        wildcards   : []
    };
        
    // split host name from path if present
    var match;
    if (match = path.match(/^https?:\/\/(.*?)(\/.*)/))
    {
        road.host = match[1];
        path = match[2];
    }

    if (path.charAt(0) !== "/")
        throw new Error("paths need to start with / (was: " + path + ")");

    //path = path.chomp("/");

    // regexify for both case sensitive and insensitive, and extract wildcard names
    var wildcardRegex = wildcardRegex = /\*|\{[a-zA-Z0-9]*\}/g,
        regex = path.replace(wildcardRegex, "([a-zA-Z0-9+.;%\-]+)").replace(/\//g, "\\/"),
        wildcards = path.match(wildcardRegex);

    road.regex = new RegExp("^"+regex+"$");
    road.iregex = new RegExp("^"+regex+"$", "i");

    var starCount = 0;
    for (var i = 0; wildcards && i < wildcards.length; i++)
    {
        if (wildcards[i] === "*")
            road.wildcards[i] = starCount++;
        else    
            road.wildcards[i] = wildcards[i].substring(1, wildcards[i].length - 1);
    }

    var method = method.toUpperCase();
    if (!this.roads[method])
        this.roads[method] = [];
    this.roads[method].push(road);
}

// Takes in any number of arguments which are objects containing a path, and at least one of GET, POST, PUT, DELETE, and optionally a filter.
Roundabout.prototype.route = function() {
    for (var i = 0; i < arguments.length; i++) {
        var road = arguments[i];
        
        var options = {};
        if (road.filter)
            options["filter"] = road.filter;
        
        var that=this;
        ["GET", "POST", "PUT", "DELETE"].forEach(function(method) {
            if (road[method]) that.event(method, road.path, road[method], options);
        });
    }
}

Roundabout.prototype.GET    = function(path, block, options) { this.event("GET", path, block, options); }
Roundabout.prototype.POST   = function(path, block, options) { this.event("GET", path, block, options); }
Roundabout.prototype.PUT    = function(path, block, options) { this.event("GET", path, block, options); }
Roundabout.prototype.DELETE = function(path, block, options) { this.event("GET", path, block, options); }

Roundabout.FORWARD_METHODS = ["GET", "POST", "PUT", "DELETE", "event", "route"];
Roundabout.FORWARD_METHODS.forEach(function(method) {
    Roundabout[method] = eval("function() { return Roundabout.application['"+method+"'].apply(Roundabout.application, arguments); }");
});

Roundabout.defaultOptions = {
    caseSensitive : false,
    longestMatchFirst : false
};

Roundabout._pushContext = function(env, context)
{
    if (env["roundabout.context"])
        env["roundabout.context_stack"].push(env["roundabout.context"]);
    else
        env["roundabout.context_stack"] = [];

    env["roundabout.context"] = context;
}
Roundabout._popContext = function(env) {
    env["roundabout.context"] = env["roundabout.context_stack"].pop();
}

// Roundabout Context: contains the environment, a request, and a response. The "this" value in Roundabout handlers is an instance of Context.

Roundabout.Context = function(env, request, response) {
    this.env = env;
    this.request = request;
    this.response = response;
    
    this.wildcards = {};
}
Roundabout.Context.prototype.redirect = function(location)
{
    this.status(307);
    this.header("Location", location);
}
Roundabout.Context.prototype.status = function(status)
{
    if (arguments.length > 0)
        this.response.status = status;
    return this.response.status;
}
Roundabout.Context.prototype.header = function(key, value)
{
    if (arguments.length > 1)
        this.response.setHeader(key, value);
    return this.response.getHeader(key);
}
Roundabout.Context.prototype.body = function(body) {
    if (arguments.length > 0)
        this.response.body = body;
    return this.response.body;
}


// Main app

Roundabout.application = new Roundabout();

Roundabout.run = function() {
    Jetty.run(CommonLogger(Roundabout.application));
}
