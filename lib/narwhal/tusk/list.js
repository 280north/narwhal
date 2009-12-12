
var tusk = require("../tusk");
var util = require("util");
var args = require("args");
var packages = require("packages");

var parser = exports.parser = new args.Parser();

parser.help('lists all installed packages');

parser.action(function (options) {
    var self = this;
    Object.keys(packages.catalog).forEach(function (name) {
        self.print(
            name + ' \0magenta(' +
            packages.catalog[name].directory + '\0)'
        );
    });
});

