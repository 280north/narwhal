
var os = require('os');
var util = require('util');
var tusk = require('../tusk');
var args = require('args');

var parser = exports.parser = new args.Parser();

parser.help('selects a platform for the current "sea"');

parser.arg('platform').optional();

parser.action(function (options) {
    var self = this;
    var directory = tusk.getDirectory();
    var platformsDirectory = directory.join('platforms');
    if (options.args.length == 0) {
        platformsDirectory.list().forEach(function (platformName) {
            self.print(platformName);
        });
    } else {
        var platform = options.args.shift();
        if (!util.has(platformsDirectory.list(), platform))
            throw new Error("No such platform");
        var narwhalConf = directory.join('narwhal.conf');
        narwhalConf.write(
            'NARWHAL_DEFAULT_PLATFORM=' +
            os.enquote(platform)
        );
    }
});


