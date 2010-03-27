require("narwhal/deprecated").deprecated(
"the term module has been moved to narwhal/term");
var UTIL = require("narwhal/util");
var TERM = require("narwhal/term");
UTIL.update(exports, TERM);
