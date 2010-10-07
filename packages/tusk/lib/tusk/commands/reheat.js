
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var tusk = require("../../tusk");
var install = require('./install');
var util = require("narwhal/util");
var args = require("narwhal/args");
var packages = require("narwhal/packages");
var parser = exports.parser = new args.Parser();

parser.help('reconsistutes the exact versions of all dependencies from a frozen project');

parser.action(function (options, name) {
    var names = packages.root.dependencies || [];
    install.install.call(this, options, names);
});

