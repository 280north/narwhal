require("narwhal/deprecated").deprecated(
"the sandbox module has been moved to narwhal/sandbox");
var UTIL = require("narwhal/util");
var SANDBOX = require("narwhal/sandbox");
UTIL.update(exports, SANDBOX);
