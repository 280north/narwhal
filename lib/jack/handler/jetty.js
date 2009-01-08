Jack.Handler.Jetty = function() {}

Jack.Handler.Jetty.run = function(app, options) {
    var options = options || {};
    
    var servletHandler = new Jack.Handler.Servlet(app);
    
    var handler = new Packages.org.mortbay.jetty.handler.AbstractHandler({
        handle: function(target, request, response, dispatch){
            try {
                servletHandler.process(request, response);
            
                request.setHandled(true);
            } catch(e) {
                print("ERROR: "+e);
                throw e;
            }
        }
    });

    var server = new Packages.org.mortbay.jetty.Server(options["port"] || 8080);
    server.setHandler(handler);
    server.start();
}
