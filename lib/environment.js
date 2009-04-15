// setup platform specific globals

global.ARGV    = require("platform").ARGV;
global.ENV     = require("platform").ENV;
global.STDOUT  = require("platform").STDOUT;
global.STDERR  = require("platform").STDERR;
global.STDIN   = require("platform").STDIN;

// The draft "system" proposal: https://wiki.mozilla.org/ServerJS/System

global.system = {
    args: ARGV,
    stdin: STDIN,
    stdout: STDOUT,
    stderr: STDERR,
    env: ENV
}

// extend the prototypes of builtin objects

require("array");
require("string");
require("regexp");
require("binary");

// default logger

var Logger = require("logger").Logger;
global.log = new Logger(STDOUT);
global.log.level = Logger.WARN;

