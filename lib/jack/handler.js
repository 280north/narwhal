Jack.Handler = {};

Jack.Handler.handlers = {};

Jack.Handler.get = function(server) {
    if (!server) return;
    return handlers[server.toLowerCase()];
}

Jack.Handler.register = function(server, klass) {
    handlers[server.toLowerCase()] = klass
}

require("handler/servlet.js");
require("handler/jetty.js");