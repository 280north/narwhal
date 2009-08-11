
var system = require('system');
var os = require('os');
var fs = require('file');
var util = require('util');
var tusk = require('../tusk');
var args = require('args');

var parser = exports.parser = new args.Parser();

parser.help('selects a engine for the current "sea"');

parser.arg('engine').optional();

parser.action(function (options) {
    var packages = require("packages");
    
    var self = this;
    var directory = tusk.getDirectory();
    var enginesDirectory = directory.join('engines');
    if (options.args.length == 0) {
        enginesDirectory.list().forEach(function (engineName) {
            self.print(engineName);
        });
    } else {
        var engine = options.args.shift();
        if (!util.has(packages.engines, engine))
            throw new Error("No such engine " + util.enquote(engine));
        var narwhalConf = directory.join('narwhal.conf');
        narwhalConf.write(
            'NARWHAL_ENGINE=' +
            os.enquote(engine) + "\n" + 
            'NARWHAL_ENGINE_HOME=' +
            os.enquote(
                packages.engines[engine].directory.from(
                    fs.path(system.prefix).join('')
                )
            ) + "\n"
        );
    }
});

