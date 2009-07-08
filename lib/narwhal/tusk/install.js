
var tusk = require("../tusk");
var util = require("util");
var args = require("args");
var fs = require("file");
var json = require("json");
var http = require("http");
var zip = require("zip");
var packages = require("packages");

var parser = exports.parser = new args.Parser();

parser.help('downloads and installs a package and its dependencies');

parser.action(function (options) {
    exports.install.call(this, options, options.args);
});

exports.install = function (options, names) {

    if (!tusk.getCatalogPath().isFile()) {
        if (options.simulate) {
            this.print("Run 'tusk update' or 'tusk create-catalog' to get a catalog.");
            return;
        }
        tusk.update.call(this, options);
    }

    var parser = this;
    var catalog = tusk.readCatalog();

    // download a catalog if the current catalog
    //  does not have a version label.
    if (!catalog.version) {
        this.print("Run 'tusk update' or 'tusk create-catalog' to get a catalog.");
        this.print("Your catalog version is no longer supported.");
        return;
    }

    // validate the requested names against those
    //  in the catalog of downloadable packages.
    var names = names.filter(function (name) {
        if (!util.has(catalog.packages, name)) {
            parser.print("ERROR: Package not found: " + util.enquote(name));
            return false;
        }
        return true;
    });

    // load the notes on user-requested and dependency packages
    //  for book keeping.
    var notes = tusk.readNotes();
    names.forEach(function (name) {
        if (!notes[name]) {
            notes[name] = {};
        }
        notes[name].requester = "user";
    });
    tusk.writeNotes(notes);

    // note broken dependency chains
    var errors = [];
    var dependencies = exports.dependencies(catalog.packages, names, errors);
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
    var zipsDirectory = tusk.getZipsDirectory();
    zipsDirectory.mkdirs();
    missing.forEach(function (name) {
        var info = catalog.packages[name];
        print('Downloading: ' + info.location);
        if (options.simulate) 
            return;
        var zipFile = zipsDirectory.join(name + '.zip')
        if (options.resume && zipFile.isFile())
            return;
        var targetPath = tusk.getDirectory().join('packages', name);
        var zipData = http.read(info.location, 'b');
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
            var targetPath = tusk.getDirectory().join('packages', name);

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

            // write package.json if it was not in the
            // archive
            var packageJson = targetPath.join('package.json');
            if (!packageJson.isFile())
                packageJson.write(
                    json.encode(catalog.packages[name], null, 4),
                    {'charset': 'UTF-8'}
                );

            // make bins executable and make symlinks
            //  in $SEA/bin
            var bin = targetPath.join('bin');
            if (bin.isDirectory())
                bin.list().forEach(function (name) {
                    var target = targetPath.join('bin', name);
                    target.chmod(0755);
                    var sea = tusk.getDirectory().join('bin');
                    var source = sea.join(name);
                    var relative = sea.to(target);
                    if (!source.linkExists()) {
                        target.symlink(source);
                    }
                });

            notes[name].finished = true;
        } catch (exception) {
            var packageJsonPath = tusk.getDirectory().join('packages', name, 'package.json');
            if (packageJsonPath.isFile())
                packageJsonPath.remove();
            throw exception;
        } finally {
            tusk.writeNotes(notes);
            /*
            if (zipFile.isFile())
                zipFile.remove();
            */
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

