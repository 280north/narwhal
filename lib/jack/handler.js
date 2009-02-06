var Handler = exports;

Handler.handlers = {};
Handler.get = function(server) {
    if (!server)
        return null;
        
    return this.handlers[server.toLowerCase()];
}
Handler.register = function(server, klass) {
    this.handlers[server.toLowerCase()] = klass
}

Handler.Jetty = require("handler/jetty").Jetty;
Handler.Simple = require("handler/simple").Simple;

Handler.register("jetty", Handler.Jetty);
Handler.register("simple", Handler.Simple);
