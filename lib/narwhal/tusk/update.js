
var tusk = require("../tusk");
var util = require("util");
var args = require("args");

var parser = exports.parser = new args.Parser();

parser.help('downloads the newest package catalog');

parser.action(function (options) {
    tusk.update.call(this, options);
});

