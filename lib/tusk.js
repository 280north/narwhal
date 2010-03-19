
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- Hannes Wallnöfer

var system = require("system");
var fs = require("file");
var packages = require("packages");
var util = require("util");
var json = require("json");
var http = require("http");

exports.catalogVersion = 2;
exports.minCatalogVersion = 2;

var args = require("args");
var parser = exports.parser = new args.Parser();

parser.help('A Narwhal project package manager.');

// parser.option('sources', exports.sources);

parser.command('list', module.id + '/commands/list')

parser.command('install', module.id + '/commands/install');

parser.command('upgrade', null)
    .help('downloads the latest version of a package');

parser.command('remove', null)
    .help('removes the local copy of package');

parser.command('update', module.id + '/commands/update');

parser.command('search', module.id + '/commands/search');

parser.command('init', module.id + '/commands/init');

parser.command('engine', module.id + '/commands/engine');

parser.command('freeze', null)
    .help('writes a freeze.json file');

parser.command('bundle', null)
    .help('creates an archive of your project and its package dependencies');

parser.command('reheat', module.id + '/commands/reheat');

parser.command('clone', module.id + '/commands/clone');

parser.command('catalog', module.id + '/commands/catalog');

parser.command('orphans', null)
    .help('lists packages that are no longer wanted by the user or other packages.')

parser.command('consolidate', module.id + '/commands/consolidate');

parser.helpful();

// utilities
//

exports.getDirectory = function () {
    return fs.path(system.prefixes[0]);
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
    var catalogPath = exports.getCatalogPath();
    if (!catalogPath.exists())
        throw new Error(catalogPath + " does not exist.");
    if (!catalogPath.isFile())
        throw new Error(catalogPath + " is not a file.");
    var catalog = json.decode(catalogPath.read({charset: 'utf-8'}));
    if (catalog.version === undefined || +catalog.version < exports.minCatalogVersion)
        throw new Error("catalog is out of date.  use tusk update or create-catalog");
    packages.normalize(catalog.packages);
    return catalog;
};

exports.writeCatalog = function (catalog) {
    var catalogPath = exports.getCatalogPath();
    print('Writing ' + catalogPath);
    return catalogPath.write(
        json.encode(catalog, null, 4),
        {charset: 'utf-8'}
    );
};

exports.update = function (options) {
    require('./tusk/update').update.call(this, options);
};

exports.getSourcesPath = function () {
    var try1 = exports.getTuskDirectory().join('sources.json');
    var try2 = exports.getDirectory().join('sources.json');
    if (try1.isFile())
        return try1;
    if (try2.isFile())
        return try2;
};

exports.readSources = function () {
    var sources = json.decode(exports.getSourcesPath().read(
        {charset: 'utf-8'}
    ));
    if (
        sources.version === undefined ||
        +sources.version < exports.minCatalogVersion
    )
        throw new Error(
            "sources file is out of date.  version " +
            exports.minCatalogVersion + " is required."
        );
    sources.sources = sources.sources || {};
    return sources;
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

exports.getHttpStore = function () {
    var Store = require("http/fs-store").Store;
    var store = new Store(exports.getTuskDirectory().join("http"));
    exports.getHttpStore = function () {
        return store;
    };
    return store;
};

// run it

exports.main = function (args) {
    var options = parser.parse(args);
    if (!options.acted)
        parser.printHelp(options);
};

if (module.id == require.main)
    exports.main(system.args);

