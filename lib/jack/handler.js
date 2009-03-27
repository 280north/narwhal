var Handler = exports;

Handler.handlers = {};
Handler.get = function(server) {
    if (!server)
        return null;
        
    return Handler.handlers[server.toLowerCase()];
}
Handler.register = function(server, klass) {
    Handler.handlers[server.toLowerCase()] = klass
}

Handler.Jetty  = require("./handler/jetty").Jetty;
Handler.Simple = require("./handler/simple").Simple;
Handler.V8CGI  = require("./handler/v8cgi").V8CGI;

Handler.register("jetty", Handler.Jetty);
Handler.register("simple", Handler.Simple);
Handler.register("v8cgi", Handler.V8CGI);
