var Jack = require("jack");

var map = {};

// an extremely simple Jack application
map["/hello"] = function(env) {
    return [200, {"Content-Type":"text/plain"}, "Hello from " + env["SCRIPT_NAME"]];
}

// 1/6th the time this app will throw an exception
map["/httproulette"] = function(env) {
    // if you have the ShowExceptions middleware in the pipeline it will print the error.
    // otherwise the server/handler will print something
    if (Math.random() > 5/6)
        throw new Error("bam!");
    
    return [200, {"Content-Type":"text/html"}, 'whew!<br /><a href="httproulette">try again</a>'];
}

var form = '<form action="" method="get"><input type="text" name="name" value="" id="some_name"><input type="submit" value="go"></p></form>';

// an index page demonstrating using a Response object
map["/"] = function(env) {
    var request = new Jack.Request(env),
        response = new Jack.Response();

    response.write('hello ' + (request.GET("name") || form) +"<br />");
        
    response.write('<a href="hello">hello</a><br />');
    response.write('<a href="httproulette">httproulette</a><br />');
    response.write('<a href="lobster">lobster</a><br />');
    response.write('<a href="stream">stream</a><br />');

    return response.finish();
}

map["/lobster"] = Jack.Lobster;

// use the JSONP middleware on this one
map["/jsontest"] = Jack.JSONP(function(env) {
    return [200, { "Content-Type" : "application/json" }, "{ hello : 'world' }"];
});

map["/files"] = Jack.File(".");

map["/stream"] = function(env) {
    return [200,
        {"Content-Type":"text/html", "Transfer-Encoding":"chunked"},
        { forEach : function(write) {
            for (var i = 0; i < 50; i++) { 
                java.lang.Thread.currentThread().sleep(100); 
                write("hellohellohellohellohellohellohellohellohellohellohellohellohello<br />"); 
            }
        }
    }];
}

// middleware:

// apply the URLMap
var app = Jack.ContentLength(Jack.URLMap(map));

// serve the "/example" directory files
Jack.Static(app, { urls : ["/example"] });
