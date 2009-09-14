
var jackutil = require("jack/utils");

var app = function (env) {
    if (/^../.test(env.PATH_INFO))
        return jackutil.responseForStatus(404, env.PATH_INFO);
    return {
        "status": 200,
        "headers": {"Content-type": "text/html"},
        "body": [
            "<html><head><script>" +

            // 1.) preload transitive dependencies and
            //    then require.
            env.script.require("narwhal/server-test") +

            // 2.) embed with transitive dependencies
            //env.script.embed("narwhal/server-test") +

            // 3.) no preloading, all async
            //env.script.loader("narwhal/server-test") +
            //".async('narwhal/server-test');" +

            "</script></head><body></body></html>"
        ]
    };
};
app = require("narwhal/server").App(app, {
    "debug": true // turn off debug for minification
    //"path": "javascript/", // to use an alternate path to the module tree
    //"proxy": "http://example.com/.js/", // to use a caching proxy
});
app = require("jack").ContentLength(app);
exports.app = app;

