// setup platform specific globals

// extend the prototypes of builtin objects

require("array");
require("string");
require("regexp");
require("binary");

// default logger

var Logger = require("logger").Logger;
global.log = new Logger(system.STDOUT);
global.log.level = Logger.WARN;

