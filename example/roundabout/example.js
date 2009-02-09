var Lobster = require("jack/lobster").Lobster;

// the simplest possible Roundabout handler: just return a string
Roundabout.GET("/", function() {
    return 'hello world!<br />'+
        '<a href="/asdf">/asdf</a><br />'+
        '<a href="/hello/jackjs.org">/hello/jackjs.org</a><br />'+
        '<a href="/dog/cat?a=b&b=c&d=e">/dog/cat?a=b&b=c&d=e</a><br />'+
        '<a href="/hello?name=joe">/hello?name=joe</a><br />'+
        '<a href="/goodbye?name=jane">/goodbye?name=jane</a><br />';
});

// Roundabout can use Jack apps as handlers too
Roundabout.GET("/asdf", Lobster);

// alternate syntax. 
Roundabout.route({
    path: "/hello/*",
    GET: function() {
        this.redirect("http://"+this.wildcards[0]);
    },
    POST: function() {
        this.redirect("/");
    },
    filter: function() {
        return true; //Math.random() < 0.5;
    }
});

// demonstrates named and indexed wildcards, and the request.GET() method.
Roundabout.GET("/*/{asdf}", function() {
    this.response.write("Hello " + this.wildcards[0] + " and " + this.wildcards["asdf"] + "<br /><br />");
    
    for (var key in this.request.GET())
        this.response.write(key + " => " + this.request.GET(key) + "<br />");
});

// Request and Response objects are given to you automagically as this.request and this.response. also, this.header and this.body are convienence methods.
Roundabout.GET("/goodbye", function() {
	var name = this.request.GET("name");
	
	this.header("Content-Type", "text/plain");
	this.body("goodbye "+name+"!");
});
