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
                print("OBJJ EXCEPTION: " + e);
                print("    Name:    " + e.name);
                print("    Message: " + e.message);
                print("    File:    " + e.fileName);
                print("    Line:    " + e.lineNumber);
                if (e.javaException)
                {
                    print("    Java Exception: " + e.javaException);
                    e.javaException.printStackTrace();
                }
                if (e.rhinoException)
                {
                    print("    Rhino Exception: " + e.rhinoException);
                    e.rhinoException.printStackTrace();
                }
                throw e;
            }
        }
    });

    var server = new Packages.org.mortbay.jetty.Server(options["port"] || 8080);
    server.setHandler(handler);
    server.start();
}
