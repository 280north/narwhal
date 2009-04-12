// setup platform specific globals

global.ARGV    = require("platform").ARGV;
global.ENV     = require("platform").ENV;
global.STDOUT  = require("platform").STDOUT;
global.STDERR  = require("platform").STDERR;
global.STDIN   = require("platform").STDIN;

// extend the prototypes of builtin objects

require("array");
require("string");
require("regexp");

// libraries to add to global namespace

global.IO      = require("io").IO;
global.File    = require("file").File;

// default logger

var Logger = require("logger").Logger;
global.log = new Logger(STDOUT);
global.log.level = Logger.WARN;

