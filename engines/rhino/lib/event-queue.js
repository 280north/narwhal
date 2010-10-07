
require("narwhal").deprecated(
"The event-queue module is deprecated in favor of event-loop-engine," + 
"which is the default engine implementation of the event loop system as" +
"used by the event-loop and event-loop-setup modules.");

var EXPORTS = require("event-loop");
var UTIL = require("narwhal/util");
UTIL.update(exports, EXPORTS);

