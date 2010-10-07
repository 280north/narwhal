
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- cadorn Christoph Dorn

var file = require("file");
var system = require("system");
var packages = require("narwhal/packages");
var util = require("narwhal/util");
var args = require("narwhal/args");

var parser = exports.parser = new args.Parser();

parser.help(
    "Constructs an 'eval'-able shell script by augmenting\n" +
    "current PATH and PATH-like environment variables with\n" +
    "directories from installed packages in their precedence\n" +
    "order.  Precedence is determined by a topological sort\n" +
    "of package dependencies.  Topo-sort guarantees that the\n" +
    "most dependent packages come first.\n" +
    "\n" +
    "    eval $(narwhal -m narwhal/env --path --ldpath)\n" +
    "    echo $PATH\n"
);


parser.option('--path', 'path')
    .help("prints a new PATH= based on package/bins")
    .set(true);
parser.option('--ldpath', 'ldpath')
    .help("prints a new LDPATH= based on package/libs")
    .set(true);
parser.option('--classpath', 'classpath')
    .help("prints a new CLASSPATH= based on package/classes and package/jars/*")
    .set(true);
parser.option('--custom')
    .help("prints a new $NAME= based on package/$name")
    .action(function (options, name, envName, pathName) {
        util.getset(options, 'custom', []).push([
            envName,
            pathName
        ]);
    });
parser.option('--extra')
    .help("prints a new $NAME= based on package/$name and package/$extra/*")
    .action(function (options, name, envName, pathName, extraName) {
        util.getset(options, 'custom', []).push([
            envName,
            pathName,
            extraName
        ]);
    });

parser.helpful();

var paths = function (envName, pathName, extraName) {

    // construct a list of paths for each installed package
    //  based on the default name, or the overridden name
    //  or names from the package configuration.
    var paths = Array.prototype.concat.apply(
        [],
        packages.order.map(function (info) {
            var paths = info[pathName] || pathName;
            if (typeof paths == "string")
                paths = [paths];
            return paths.map(function (path) {
                return info.directory.resolve(path);
            });
        })
    // and add the list of existing values from the
    //  corresponding environment value (in lower
    //  precedence, packages will override previous
    //  values)
    ).concat(
        (system.env[envName] || '')
        .split(":")
        // filter blank components, or empty env var
        .filter(function (path) {
            return path;
        }).map(function (path) {
            return new file.Path(path);
        })
    // grab only the ones that exist
    ).filter(function (path) {
        return path.isDirectory();
    });

    // grab individual files for the extra directory name
    if (extraName) {
        paths = Array.prototype.concat.apply(
            paths,
            Array.prototype.concat.apply(
                [],
                // as before, find the directories in
                //  package precedence order, accepting
                //  overrides from the package configuration
                packages.order.map(function (info) {
                    var paths = info[extraName] || extraName;
                    if (typeof paths == "string")
                        paths = [paths];
                    return paths.map(function (path) {
                        return info.directory.resolve(path);
                    }).filter(function (path) {
                        return path.isDirectory();
                    });
                })
            // each individual file within that directory,
            //  as with *.jar in jars/
            ).map(function (path) {
                return path.listPaths();
            })
        );
    }
    
    paths = paths.map(function (path) {
        return path.canonical().toString();
    });

    return util.unique(paths).join(":");
};

exports.main = function (system) {

    var options = parser.parse(system.args);

    if (options.path)
        system.print("PATH=" + paths("PATH", "bin"));
    if (options.ldpath)
        system.print("LDPATH=" + paths("LDPATH", "lib"));
    if (options.classpath)
        system.print("CLASSPATH=" + paths(
            "CLASSPATH", "classes",
            "jars"
        ));
    util.forEachApply(options.custom, function (pathName, envName) {
        system.print(envName + "=" + paths(envName, pathName));
    });

};

if (require.main == module.id)
    exports.main(system);

