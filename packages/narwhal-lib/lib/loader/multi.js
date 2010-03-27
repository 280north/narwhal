require("narwhal/deprecated").deprecated(
"the loader/multi module has been moved to narwhal/loader/multi");
var UTIL = require("narwhal/util");
var MULTI = require("narwhal/loader/multi");
UTIL.update(exports, MULTI);
