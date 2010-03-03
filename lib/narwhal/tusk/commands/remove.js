
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var tusk = require("../../tusk");
var util = require("util");
var args = require("args");
var parser = exports.parser = new args.Parser();

parser.help('removes the local copy of package');

parser.action(function (options) {
    var names = options.args;
});

exports.remove = function () {
};

