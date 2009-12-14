
var tusk = require("../tusk");
var os = require("os");
var util = require("util");
var args = require("args");

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

parser.action(function (options) {
    var self = this;
    if (!util.len(options.args))
        throw new Error("Package name required");
    var packagesDirectory = tusk.getPackagesDirectory();
    var sources = tusk.readSources().packages;
    var catalog = tusk.readCatalog().packages;
    var owner = options.owner;
    options.args.forEach(function (name) {
        if (!util.has(sources, name))
            throw new Error("Package does not exist: " + name);
        var source = util.get(sources, name);
        if (source.type !== "github")
            throw new Error("Package " + util.enquote(name) + " is not a Github package.");
    });
    options.args.forEach(function (name) {
        var source = util.get(sources, name);
        var githubName = util.get(source, 'name', name);
        var user = options.user || source.user;
        var command = [
            'git',
            'clone',
            owner ?
            (
                'git@github.com:' + user +
                '/' + githubName + '.git'
            ):
            (
                'git://github.com/' +
                user + '/' + githubName + '.git'
            ),
            packagesDirectory.join(name)
        ];
        self.print('\0cyan(' + command.map(function (term) {
            var enquoted = os.enquote(term);
            if (enquoted != "'" + term + "'")
                return enquoted;
            return term;
        }).join(' ') + '\0)');
        os.system(command);
    });
});

parser.helpful();

