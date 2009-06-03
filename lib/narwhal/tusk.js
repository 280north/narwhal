
var fs = require("file");
var packages = require("packages");
var util = require("util");
var json = require("json");
var http = require("http");
var zip = require('zip');

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
    options.acted = true;
    print('Downloading.');
    var catalogData = http.read('http://github.com/kriskowal/narwhal/raw/master/catalog.json');
    print('Saving.');
    exports.getCatalogPath().write(catalogData, 'b');
};

exports.createCatalog = function (options) {
    options.acted = true;
    var catalog = {};
    util.mapApply(
        util.items(exports.readSources()),
        function (name, source) {
            if (source.type !== "github")
                throw new Error(
                    "Project " + exports.enquote(name) +
                    " has an urecognized type: " +
                    exports.enquote(source)
                );
            return source.user + '/' + name;
        }
    ).forEach(function (project) {
        print(project);
        var location = "http://github.com/" + project + "/raw/master/package.json";
        var text = http.read(location).toString('utf-8');
        var projectData = json.decode(text);
        projectData.githubName = project;
        projectData.location = location;
        name = projectData.name || project.split('/').pop();
        catalog[name] = projectData;
    });
    exports.writeCatalog(catalog);
};

exports.install = function (options, name) {
    options.acted = true;

    if (!exports.getCatalogPath().isFile()) {
        if (options.simulate) {
            print("Run 'tusk update' or 'tusk create-catalog' to get a catalog.");
            return;
        }
        exports.update(options);
    }

    var parser = this;
    var catalog = exports.readCatalog();
    var names = options.args.filter(function (name) {
        if (!util.has(catalog, name)) {
            parser.print("ERROR: Package not found: " + util.enquote(name));
            return false;
        }
        return true;
    });

    // load the notes on user-requested and dependency packages
    var notes = exports.readNotes();
    names.forEach(function (name) {
        if (!notes[name]) {
            notes[name] = {};
        }
        notes[name].requester = "user";
    });
    exports.writeNotes(notes);

    // note broken dependency chains
    var errors = [];
    var dependencies = exports.dependencies(catalog, names, errors);
    if (errors.length) {
        print('The following dependencies could not be found in the catalog:');
        printUl(errors.map(function (ancestry) {
            return ancestry.join(' <- ');
        }));
        print('Please notify the package system maintainers.');
        this.exit();
    }

    // notify of packages already installed
    var already = exports.already(packages.catalog, names);
    if (already.length) {
        print('The following packages are already installed:');
        printUl(already);
    }

    // note missing packages
    var missing = exports.missing(packages.catalog, dependencies);
    if (!missing.length) {
        print('No new packages to install.');
        this.exit();
    }
    print('The following packages will be downloaded and installed:');
    printUl(missing);

    // download missing packages
    var zipsDirectory = exports.getTuskDirectory().join('zips');
    zipsDirectory.mkdirs();
    missing.forEach(function (name) {
        var packageInfo = catalog[name];
        var url = 'http://github.com/' + packageInfo.githubName + '/zipball/master';
        print('Downloading: ' + url);
        if (options.simulate) 
            return;
        var zipFile = zipsDirectory.join(name + '.zip')
        if (options.resume && zipFile.isFile())
            return;
        var targetPath = exports.getDirectory().join('packages', name);
        var zipData = http.read(url, 'b');
        zipFile.write(zipData, 'b');
    });

    // install missing packages
    missing.forEach(function (name) {
        if (!notes[name])
            notes[name] = {}
        if (!notes[name].files)
            notes[name].files = [];
        if (!notes[name].requester)
            notes[name].requester = "module";
        try {
            var zipFile = zipsDirectory.join(name + '.zip')
            print('Unzipping: ' + zipFile);
            if (options.simulate)
                return;
            var targetPath = exports.getDirectory().join('packages', name);

            // unzip
            new zip.Unzip(zipFile).forEach(function (entry) {
                if (entry.isDirectory())
                    return;
                var parts = fs.split(entry.getName());
                parts.shift(); // name-project-comment ref dirname
                var path = targetPath.join(fs.join.apply(null, parts));
                path.dirname().mkdirs();
                notes[name].files.push(path);
                print(path);
                path.write(entry.read('b'), 'b');
            });

            // make bins executable and make symlinks
            //  in $SEA/bin
            var bin = targetPath.join('bin');
            if (bin.isDirectory())
                bin.list().forEach(function (name) {
                    var target = targetPath.join('bin', name);
                    target.chmod(0755);
                    var sea = exports.getDirectory().join('bin');
                    var source = sea.join(name);
                    var relative = sea.to(target);
                    if (!source.linkExists()) {
                        target.symlink(source);
                    }
                });

            notes[name].finished = true;
        } catch (exception) {
            var packageJsonPath = exports.getDirectory().join('packages', name, 'package.json');
            if (packageJsonPath.isFile())
                packageJsonPath.remove();
            throw exception;
        } finally {
            exports.writeNotes(notes);
            if (zipFile.isFile())
                zipFile.remove();
        }
    });

    print('Done.');

};

function printUl(lines) {
    lines.forEach(function (line) {
        print(' * ' + line);
    });
};

exports.dependencies = function (catalog, names, errors) {
    var dependencies = {};
    names.forEach(function (name) {
        scan(catalog, dependencies, name, [], errors);
    });
    return Object.keys(dependencies);
};

var scan = function (catalog, dependencies, name, ancestry, errors) {
    if (util.has(dependencies, name))
        return;
    ancestry = [name].concat(ancestry);
    if (!util.has(catalog, name)) {
        errors.push(ancestry);
        return;
    }
    dependencies[name] = true;
    (catalog[name].dependencies || []).forEach(function (child) {
        scan(catalog, dependencies, child, ancestry, errors);
    });
};

exports.already = function (catalog, names) {
    return names.filter(function (packageName) {
        return util.has(catalog, packageName);
    });
};

exports.missing = function (catalog, names) {
    return names.filter(function (packageName) {
        return !util.has(catalog, packageName);
    });
};

exports.list = function (options) {
    var self = this;
    options.acted = true;
    Object.keys(packages.catalog).forEach(function (name) {
        self.print(
            name + ' \0magenta(' +
            packages.catalog[name].directory + '\0)'
        );
    });
};

exports.catalog = function (options) {
    options.acted = true;
    Object.keys(exports.readCatalog()).forEach(print);
};

exports.init = function (options) {
    options.acted = true;
    var packageInfo = {};
    var path;
    if (options.args.length && !/^-/.test(options.args[0]))
        path = options.args.shift();
    else
        path = fs.cwd();
    require('./tusk-init').parser.parse(options.args, packageInfo, true);
    delete packageInfo.args;
    path = fs.path(path).absolute();
    print(path);
    path.join('.tusk').mkdirs();
    path.join('bin').mkdirs();
    path.join('lib').mkdirs();
    system.platforms.forEach(function (platform) {
        platform = path.join('platforms', platform);
        platform.join('lib').mkdirs();
    });
    path.join('packages').mkdirs();

    var sea = path.join('bin', 'sea');
    fs.path(system.prefix).join('bin', 'sea').copy(sea);
    sea.chmod(0755);

    var activate = path.join('bin', 'activate.bash');
    fs.path(system.prefix).join('bin', 'activate.bash')
        .copy(activate);

    path.join('README').touch();
    path.join('narwhal.conf')
        .write('NARWHAL_DEFAULT_PLATFORM=' + system.platform);
    var packagePath = path.join('package.json');
    if (packagePath.isFile())
        util.complete(
            packageInfo, 
            json.decode(packagePath.read({charset:'utf-8'}))
        );
    packagePath.write(
        json.encode(packageInfo, null, 4),
        {charset:'utf-8'}
    );
};


var args = require("args");
var parser = exports.parser = new args.Parser();

parser.help('A Narwhal project package manager.');

parser.command('list', exports.list)
    .help('lists all installed packages');

parser.command('install', exports.install)
    .help('downloads and installs a package and its dependencies');

parser.option('-i', '--install')
    .action(exports.install);

parser.command('upgrade', exports.upgrade)
    .help('NYI downloads the latest version of a package');

parser.command('remove', exports.remove)
    .help('NYI removes the local copy of package');

parser.command('update', exports.update)
    .help('downloads the newest package catalog');

parser.command('search', exports.search)
    .help('NYI searches the package catalog');

parser.command('init', exports.init)
    .help('Initializes a Narwhal package/project dir.');

parser.command('freeze', exports.freeze)
    .help('NYI writes a freeze.json file');

parser.command('reheat', exports.reheat)
    .help('NYI reconsistutes the exact versions of all dependencies from a frozen site.');

parser.command('clone', exports.clone)
    .help('NYI clones a package from its version control system');

parser.command('catalog', exports.catalog)
    .help('lists all packages in the catalog');

parser.command('create-catalog', exports.createCatalog)
    .help('creates a catalog of packages from sources.json');

parser.command('update-sources')
    .help('downloads the newest list of package sources')

parser.command('orphans')
    .help('NYI lists packages that are no longer wanted by the user or other packages.')

parser.option('-h', '--help').action("printHelp");
parser.command('help', "printHelp")

exports.main = function (args) {
    var options = parser.parse(args);
    if (!options.acted)
        parser.printHelp(options);
};

if (require.id == require.main)
    return exports.main(system.args);

