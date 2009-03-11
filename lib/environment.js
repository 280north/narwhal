// setup platform specific globals

__global__.ARGV    = require("platform").ARGV;
__global__.ENV     = require("platform").ENV;
__global__.STDOUT  = require("platform").STDOUT;
__global__.STDERR  = require("platform").STDERR;
__global__.STDIN   = require("platform").STDIN;

// extend the prototypes of builtin objects

require("array");
require("string");
require("regexp");

// libraries to add to global namespace

__global__.IO      = require("io").IO;
__global__.File    = require("file").File;

// default logger

var Logger = require("logger").Logger;
__global__.log = new Logger(STDOUT);
__global__.log.level = Logger.WARN;

