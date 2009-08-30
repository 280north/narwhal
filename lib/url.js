var uri = require("uri");
var util = require("util");
var system = require("system");
system.log.error("The 'url' module is deprecated in favor of 'uri'.");
util.update(exports, uri);
