
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var tusk = require("../../tusk");
var os = require("os");
var util = require("narwhal/util");
var args = require("narwhal/args");

var parser = exports.parser = new args.Parser();

parser.help('clones a package from its version control system.')

parser.args('package');

parser.option('-o', '--owner', 'owner')
    .help("clone from the owner's repository")
    .bool()
    .inverse();

parser.option('-u', '--user', 'user')
    .help('overrides the user name from which to clone the package')
    .set();

parser.option('-s', '--ssh', 'ssh')
    .help('clone using the git@github.com style url.')
    .set(true);

parser.option('--http', 'http')
    .help('close using http instead of the git protocol')
    .set(true);

parser.action(function (options) {
    exports.clone.call(this, options, options.args);
});

exports.clone = function (options, names) {
    var self = this;
    if (!util.len(names))
        throw new Error("Package name required");
    var packagesDirectory = tusk.getPackagesDirectory();
    var sources = tusk.readSources().sources;
    var catalog = tusk.readCatalog().packages;
    var owner = options.owner;
    names.forEach(function (name) {
        if (!util.has(sources, name))
            throw new Error("Package does not exist: " + name);
        var source = util.get(sources, name);
        if (source.type !== "github")
            throw new Error("Package " + util.enquote(name) + " is not a Github package.");
    });
    names.forEach(function (name) {
        var source = util.get(sources, name);
        var targetPath = packagesDirectory.join(name);
        var githubName = util.get(source, 'name', name);
        var user = options.user || source.user;
        var command = [
            'git',
            'clone',
            (owner || options.ssh) ?
            (
                'git@github.com:' + user +
                '/' + githubName + '.git'
            ):
            (
                (options.http ?
                (
                    'http'
                ):
                (
                    'git'
                )) +
                '://github.com/' +
                user + '/' + githubName + '.git'
            ),
            targetPath
        ];
        self.print('\0cyan(' + command.map(function (term) {
            var enquoted = os.enquote(term);
            if (enquoted != "'" + term + "'")
                return enquoted;
            return term;
        }).join(' ') + '\0)');
        if (os.system(command))
            throw "'" + command.join(" ") + "' failed";
        require("./install").finish(targetPath);
    });
};

parser.helpful();

