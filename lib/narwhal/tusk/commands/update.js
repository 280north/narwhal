
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var UPDATE = require("../update");
var ARGS = require("args");
var FS = require("file");

var parser = exports.parser = new ARGS.Parser();

parser.args("PACKAGE");

parser.help('downloads the newest package catalog');

parser.option('-c', '--use-cache')
    .help("configures to use already downloaded files when possible")
    .set(true);

parser.option('-i', '--input')
    .help("specifies an alternate location to read the input catalog sources")
    .set();

parser.option('-o', '--output')
    .help("specifies an alternate location to write the output catalog")
    .set();

parser.option('-d', '--default', 'useDefaultSources')
    .help("use default sources instead of $SEA/.tusk/sources.json")
    .set(true);

parser.helpful();

parser.action(function (options) {
    var policy = {};
    policy.useCache = options.useCache;
    policy.input = options.input && FS.path(options.input);
    policy.output = options.output && FS.path(options.output);
    policy.useDefaultSources = options.useDefaultSources;
    if (!options.args.length) {
        UPDATE.update(policy);
    } else {
        UPDATE.updatePackages(options.args, policy);
    }
});

