var Jack = exports;

Jack.Utils = require("jack/utils");

Jack.Handler = require("jack/handler");
Jack.Adapter = require("jack/adapter");

Jack.Request = require("jack/request").Request;
Jack.Response = require("jack/response").Response;

Jack.Mime = require("jack/mime").Mime;

var middleware = require("jack/middleware");
for (var name in middleware)
    Jack[name] = middleware[name];
    
Jack.Lobster = require("jack/lobster").Lobster;
