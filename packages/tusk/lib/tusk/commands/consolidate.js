
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var tusk = require("../../tusk");
var util = require("narwhal/util");
var args = require("narwhal/args");
var fs = require("file");
var packages = require("narwhal/packages");

var parser = exports.parser = new args.Parser();

parser.help('consolidates all installed packages into the current sea.');

parser.action(function (options) {
    var self = this;
    var packagesDirectory = tusk.getPackagesDirectory();
    util.forEachApply(util.items(packages.catalog), function (name, info) {
        var target = packagesDirectory.join(name);
        if (!target.exists()) {
            fs.symlink(info.directory, target);
            self.print(target + ' -> ' + info.directory);
        }
    });
});

parser.helpful();

