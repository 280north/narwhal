
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var tusk = require("../../tusk");
var util = require("narwhal/util");
var args = require("narwhal/args");
var packages = require("narwhal/packages");

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

