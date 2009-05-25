
var fs = require("file");
var packages = require("packages");
var base = require("base");
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
    return exports.getDirectory().join('catalog.json');
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

// commands
//

exports.createCatalog = function (options) {
    options.acted = true;
    var catalog = {};
    base.mapApply(
        base.items(exports.readSources()),
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
        if (!base.has(catalog, name)) {
            parser.print("Package not found: " + base.enquote(name));
            parser.exit();
        }
        return name;
    });

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
    if (base.has(dependencies, name))
        return;
    ancestry = [name].concat(ancestry);
    if (!base.has(catalog, name)) {
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
        return base.has(catalog, packageName);
    });
};

exports.missing = function (catalog, names) {
    return names.filter(function (packageName) {
        return !base.has(catalog, packageName);
    });
};

exports.list = function (options) {
    options.acted = true;
    Object.keys(packages.catalog).forEach(print);
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
            name: 'list',
            help: 'lists all installed packages',
            action: exports.list
        },
        {
            _:'i',
            __:'install',
            name: 'package',
            help: 'installs a package',
            action: exports.install
        },
        {
            _:'u',
            __:'upgrade',
            help: 'downloads the latest version of a package',
            action: function (options, name, value) {
                options.acted = true;
            }
        },
        {
            _:'r',
            __:'remove',
            help: 'NYI removes a package',
            hidden: true,
            action: function (options, name, value) {
                options.acted = true;
            }
        },
        {
            __:'clone',
            name: 'package',
            help: 'NYI clones a package for development',
            action: function (options, name, value) {
                options.acted = true;
            }
        },
        {
            _:'u',
            __:'update',
            help: 'NYI updates the package catalog',
            action: function () {}
        },
        {
            _:'s',
            __:'search',
            name: 'keywords',
            help: 'NYI searches the package catalog',
            action: function (options, name) {
                options.acted = true;
            }
        },
        {
            __:'catalog',
            name: 'catalog',
            help: 'lists all package names in the catalog',
            action: exports.catalog
        },
        {
            __:'create-catalog',
            help: 'creates a catalog of packages from source.json',
            action: exports.createCatalog
        },
        {
            __:'download-catalog',
            help: 'NYI downloads the package catalog from Narwhal Central, deep in the North Sea',
            action: function () {}
        },
        {
            __:'download-sources',
            help: 'NYI downloads the package source list from Narwhal Central',
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

if (require.id == require.main) {
    var options = parser.parse(system.args);
    if (!options.acted)
        parser.printHelp(options);
}

