require("narwhal/deprecated").deprecated(
"the loader module has been moved to narwhal/loader");
var UTIL = require("narwhal/util");
var LOADER = require("narwhal/loader");
UTIL.update(exports, LOADER);
