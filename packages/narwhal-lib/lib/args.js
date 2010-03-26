require("narwhal/deprecated").deprecated(
"the args module has been moved to narwhal/args");
var ARGS = require("narwhal/args");
var UTIL = require("narwhal/util");
UTIL.update(exports, ARGS);
