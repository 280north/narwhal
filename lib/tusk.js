
var fs = require("file");
var packages = require("packages");
var util = require("util");
var json = require("json");
var http = require("http");
var zip = require('zip');

exports.getDirectory = function () {
    return fs.path(system.packagePrefixes[0]);
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
    return exports.getCatalogPath().write(
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
    var parser = this;
    options.acted = true;
    var catalog = exports.readCatalog();
    var names = options.args.map(function (name) {
        if (!util.has(catalog, name)) {
            parser.print("Package not found: " + util.enquote(name));
            parser.exit();
        }
        return name;
    });

    // load the notes on user-requested and dependency packages
    var notes = exports.readNotes();
    names.forEach(function (name) {
        notes[name] = "user";
    });
    exports.writeNotes(notes);

    // note broken dependency chains
    var errors = [];
    var dependencies = exports.dependencies(catalog, names, errors);
    if (errors.length) {
        print('The following dependencies could not be found:');
        printUl(errors.map(function (ancestry) {
            return ancestry.join(' <- ');
        }));
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
        var zipFile = zipsDirectory.join(name + '.zip')
        var targetPath = exports.getDirectory().join('packages', name);
        var packageInfo = catalog[name];
        var url = 'http://github.com/' + packageInfo.githubName + '/zipball/master';
        print('Downloading: ' + url);
        var zipData = http.read(url, 'b');
        zipFile.write(zipData, 'b');
    });

    // install missing packages
    try {
        missing.forEach(function (name) {
            var zipFile = zipsDirectory.join(name + '.zip')
            print('Unzipping: ' + zipFile);
            var targetPath = exports.getDirectory().join('packages', name);
            new zip.Unzip(zipFile).forEach(function (entry) {
                if (entry.isDirectory())
                    return;
                var parts = fs.split(entry.getName());
                parts.shift(); // name-project-comment ref dirname
                var path = targetPath.join(fs.join.apply(null, parts));
                path.dirname().mkdirs();
                print(path);
                path.write(entry.read('b'), 'b');
            });
            if (!util.has(notes, name))
                notes[name] = "dependency";
        });
    } finally {
        exports.writeNotes(notes);
    }

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
    options.acted = true;
    Object.keys(packages.catalog).forEach(function (name) {
        print(name + ' ' + packages.catalog[name].directory);
    });
};

exports.catalog = function (options) {
    options.acted = true;
    Object.keys(exports.readCatalog()).forEach(print);
};

var args = require("args");
var parser = exports.parser = new args.Parser({
    help: 'A Narwhal project package manager.',
    options: [
        {
            _:'l',
            __:'list',
            help: 'lists all installed packages',
            action: exports.list
        },
        {
            _:'i',
            __:'install',
            help: 'installs a package',
            action: exports.install
        },
        {
            _:'u',
            __:'upgrade',
            help: 'NYI downloads the latest version of a package',
            action: function () {}
        },
        {
            _:'r',
            __:'remove',
            help: 'NYI removes a package',
            action: function () {}
        },
        {
            _:'u',
            __:'update',
            help: 'downloads the newest package catalog',
            action: exports.update
        },
        {
            _:'s',
            __:'search',
            help: 'NYI searches the package catalog',
            action: function (options, name) {}
        },
        {
            __:'freeze',
            name: 'freeze',
            help: 'NYI writes a freeze.json file',
            action: function () {}
        },
        {
            __:'refreeze',
            help: 'NYI installs the exact versions from freeze.json',
            action: function () {}
        },
        {
            __:'clone',
            help: 'NYI clones a package for development',
            action: function () {}
        },
        {
            __:'catalog',
            help: 'lists all package names in the catalog',
            action: exports.catalog
        },
        {
            __:'create-catalog',
            help: 'creates a catalog of packages from source.json',
            action: exports.createCatalog
        },
        {
            __:'download-sources',
            help: 'NYI downloads the package source list from Narwhal Central',
            action: function () {}
        },
        {
            __:'orphans',
            help: 'NYI lists packages that are no longer wanted by the user or other packages',
            action: function () {}
        },
        {
            _:'h',
            __:'help',
            help: 'prints this help message',
            action: "printHelp"
        }
    ]
});

exports.main = function (args) {
    var options = parser.parse(args);
    if (!options.acted)
        parser.printHelp(options);
};

if (require.id == require.main)
    return exports.main(system.args);

