
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var tusk = require("../../tusk");
var util = require("narwhal/util");
var args = require("narwhal/args");

var parser = exports.parser = new args.Parser();

parser.help('lists all packages in the catalog');

parser.action(function (options) {
    var self = this;
    if (!tusk.getCatalogPath().isFile())
        require('./update').update.call(this, options);
    util.forEachApply(tusk.readCatalog().packages, function (name, info) {
        name = info.name || name;
        self.print(
            "\0green(" + name + "\0)" + 
            (info.description ? ": " + info.description : "")
        );
    });
});

