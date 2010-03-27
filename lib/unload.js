require("narwhal/deprecated").deprecated(
"the unload module has been moved to event-loop-hook");
var UTIL = require("narwhal/util");
var HOOK = require("event-loop-hook");
UTIL.update(exports, HOOK);
