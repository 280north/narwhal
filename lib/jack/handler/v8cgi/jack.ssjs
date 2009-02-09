var JACK_PATH = "jack";

include(JACK_PATH + "/core.js"); // this is v8cgi's function. FIXME: currently gets blown away by ours.

var Jack = require(JACK_PATH + "/lib/jack");

var app = function(env) {
    return [200, {"Content-Type":"text/html"}, "hello world!"];
}

app = Jack.Lint(app);

Jack.Handler.V8CGI.run(app, request, response);
