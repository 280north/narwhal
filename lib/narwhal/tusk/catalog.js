
var tusk = require("../tusk");
var util = require("util");
var args = require("args");

var parser = exports.parser = new args.Parser();

parser.help('lists all packages in the catalog');

parser.action(function (options) {
    if (!tusk.getCatalogPath().isFile())
        require('./update').update.call(this, options);
    Object.keys(tusk.readCatalog().packages).forEach(print);
});

