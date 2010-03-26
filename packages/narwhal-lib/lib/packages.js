require("narwhal/deprecated").deprecated(
"the packages module has been moved to narwhal/packages");
var UTIL = require("narwhal/util");
var PACKAGES = require("narwhal/packages");
UTIL.update(exports, PACKAGES);
