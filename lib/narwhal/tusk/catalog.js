
var tusk = require("../tusk");
var util = require("util");
var args = require("args");

var parser = exports.parser = new args.Parser();

parser.help('lists all packages in the catalog');

parser.action(function (options) {
    Object.keys(exports.readCatalog().packages).forEach(print);
});

