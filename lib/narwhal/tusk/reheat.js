
var tusk = require("../tusk");
var install = require('./install');
var util = require("util");
var args = require("args");
var packages = require('packages');
var parser = exports.parser = new args.Parser();

parser.help('reconsistutes the exact versions of all dependencies from a frozen project');

parser.action(function (options, name) {
    var names = packages.root.dependencies || [];
    install.install.call(this, options, names);
});

