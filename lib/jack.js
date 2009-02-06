var Jack = exports.Jack = {};

Jack.Utils = require("jack/utils");

Jack.Handler = require("jack/handler");
Jack.Adapter = require("jack/adapter");

Jack.Request = require("jack/request").Request;
Jack.Response = require("jack/response").Response;

Jack.Middleware = require("jack/middleware");
for (var middleware in Jack.Middleware)
    Jack[middleware] = Jack.Middleware[middleware];
    
Jack.Lobster = require("jack/lobster").Lobster;
