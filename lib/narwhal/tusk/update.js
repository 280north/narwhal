
var tusk = require("../tusk");
var util = require("util");
var args = require("args");
var http = require("http");

var parser = exports.parser = new args.Parser();

parser.help('downloads the newest package catalog');

parser.action(function (options) {
    exports.update.call(this, options);
});

exports.update = function (options) {
    this.print('\0blue(Downloading catalog.\0)');
    var catalogData = http.read('http://github.com/tlrobinson/narwhal/raw/master/catalog.json');
    this.print('\0green(Saving catalog.\0)');
    tusk.getCatalogPath().write(catalogData, 'b');
};

