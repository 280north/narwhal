
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
    var sources = tusk.readSources();
    var catalog = tusk.readCatalog();
    var owner = options.owner;
    options.args.forEach(function (packageName) {
        if (!util.has(sources, packageName))
            throw new Error("Package does not exist: " + packageName);
        var source = util.get(sources, packageName);
        if (source.type !== "github")
            throw new Error("Package " + util.enquote(packageName) + " is not a Github package.");
    });
    options.args.forEach(function (packageName) {
        var source = util.get(sources, packageName);
        var user = options.user || source.user;
        var command = [
            'git',
            'clone',
            owner ?
            (
                'git@github.com:' + user +
                '/' + packageName + '.git'
            ):
            (
                'git://github.com/' +
                user + '/' + packageName + '.git'
            ),
            packagesDirectory.join(packageName)
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

