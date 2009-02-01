require("../jack");

Jack.Handler = {};

Jack.Handler.handlers = {};
Jack.Handler.get = function(server) {
    if (!server)
        return null;
        
    return this.handlers[server.toLowerCase()];
}
Jack.Handler.register = function(server, klass) {
    this.handlers[server.toLowerCase()] = klass
}

require("handler/jetty");
require("handler/simple");

Jack.Handler.register("jetty", Jack.Handler.Jetty);
Jack.Handler.register("simple", Jack.Handler.Simple);
