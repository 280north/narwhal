
var fs = require("file");
var packages = require("packages");
var util = require("util");
var json = require("json");
var http = require("http");

exports.getDirectory = function () {
    return fs.path(system.packagePrefixes[0]);
};

exports.getPackagesDirectory = function () {
    return exports.getDirectory().join('packages');
};

exports.getTuskDirectory = function () {
    var tuskDirectory = exports.getDirectory().join('.tusk');
    tuskDirectory.mkdirs();
    return tuskDirectory;
}

exports.getZipsDirectory = function () {
    return exports.getDirectory().join('zips');
};

exports.getCatalogPath = function () {
    return exports.getTuskDirectory().join('catalog.json');
};

exports.readCatalog = function () {
    return json.decode(exports.getCatalogPath().read(
        {charset: 'utf-8'}
    ));
};

exports.writeCatalog = function (catalog) {
    var catalogPath = exports.getCatalogPath();
    print('Writing ' + catalogPath);
    return catalogPath.write(
        json.encode(catalog, null, 4),
        {charset: 'utf-8'}
    );
};

exports.getSourcesPath = function () {
    return exports.getDirectory().join('sources.json');
};

exports.readSources = function () {
    return json.decode(exports.getSourcesPath().read(
        {charset: 'utf-8'}
    ));
};

exports.writeSources = function (sources) {
    return exports.getSourcesPath().write(
        json.encode(sources, null, 4),
        {charset: 'utf-8'}
    );
};

exports.getNotesPath = function () {
    return exports.getTuskDirectory().join('notes.json');
};

exports.readNotes = function () {
    var notesPath = exports.getNotesPath();
    if (!notesPath.isFile())
        return {};
    return json.decode(notesPath.read(
        {charset: 'utf-8'}
    ));
};

exports.writeNotes = function (notes) {
    return exports.getNotesPath().write(
        json.encode(notes, null, 4),
        {charset: 'utf-8'}
    );
};

// commands
//

exports.update = function (options) {
    print('Downloading catalog.');
    var catalogData = http.read('http://github.com/tlrobinson/narwhal/raw/master/catalog.json');
    print('Saving catalog.');
    exports.getCatalogPath().write(catalogData, 'b');
};

exports.createCatalog = function (options) {
    var sources = exports.readSources();
    var catalog = {};
    catalog.version = util.copy(sources.version);
    var packages = catalog.packages = {};
    util.forEachApply(
        util.items(sources.packages || {}),
        function (name, source) {
            var info;
            print(name);
            if (source.type == "inline") {
                info = util.copy(source['package.json']);
            } else if (source.type == "github") {
                var githubName = source.name || name;
                if (!source.user)
                    throw new Error("package source " + util.enquote(name) + " did not have a github user name");
                var project = source.user + '/' + githubName;
                var url = "http://github.com/" + project + "/raw/master/package.json";
                var text = http.read(url).toString('utf-8');
                info = json.decode(text);
                info.type = "zip";
                info.location = 'http://github.com/' + source.user + '/' + githubName + '/zipball/master';
            } else {
                throw new Error(
                    "Project " + exports.enquote(name) +
                    " has an urecognized type: " +
                    exports.enquote(source.type)
                );
            }
            packages[name] = info;
        }
    );
    exports.writeCatalog(catalog);
};

exports.list = function (options) {
    var self = this;
    Object.keys(packages.catalog).forEach(function (name) {
        self.print(
            name + ' \0magenta(' +
            packages.catalog[name].directory + '\0)'
        );
    });
};

exports.catalog = function (options) {
    Object.keys(exports.readCatalog().packages).forEach(print);
};


var args = require("args");
var parser = exports.parser = new args.Parser();

parser.help('A Narwhal project package manager.');

// parser.option('sources', exports.sources);

parser.command('list', exports.list)
    .help('lists all installed packages');

parser.command('install', module.id + '/install');

parser.command('upgrade', exports.upgrade)
    .help('downloads the latest version of a package');

parser.command('remove', exports.remove)
    .help('removes the local copy of package');

parser.command('update', exports.update)
    .help('downloads the newest package catalog');

parser.command('search', exports.search)
    .help('searches the package catalog');

parser.command('init', module.id + '/init');

parser.command('platform', module.id + '/platform');

parser.command('freeze', exports.freeze)
    .help('writes a freeze.json file');

parser.command('reheat', exports.reheat)
    .help('reconsistutes the exact versions of all dependencies from a frozen site.');

parser.command('clone', module.id + '/clone');

parser.command('catalog', exports.catalog)
    .help('lists all packages in the catalog');

parser.command('create-catalog', exports.createCatalog)
    .help('creates a catalog of packages from sources.json');

parser.command('update-sources')
    .help('downloads the newest list of package sources')

parser.command('orphans')
    .help('lists packages that are no longer wanted by the user or other packages.')

parser.command('consolidate', module.id + '/consolidate');

parser.helpful();

exports.main = function (args) {
    var options = parser.parse(args);
    if (!options.acted)
        parser.printHelp(options);
};

if (module.id == require.main)
    return exports.main(system.args);

