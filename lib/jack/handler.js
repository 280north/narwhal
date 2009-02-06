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
//require("handler/simple");

Handler.register("jetty", Handler.Jetty);
//Jack.Handler.register("simple", Jack.Handler.Simple);
