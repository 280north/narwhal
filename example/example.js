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

// an index page demonstrating using a Response object
map["/"] = function(env) {
    var response = new Jack.Response();

    response.write('<a href="hello">hello</a><br />');
    response.write('<a href="httproulette">httproulette</a><br />');
    response.write('<a href="lobster">lobster</a><br />');

    return response.finish();
}

// the "Lobster" sample app
if (Jack.Lobster)
    map["/lobster"] = Jack.Lobster;


map["/jsontest"] = Jack.JSONP(function(env) {
    return [200, { "Content-Type" : "application/json" }, "{ hello : 'world' }"];
})

// middleware:

Jack.URLMap(map);
