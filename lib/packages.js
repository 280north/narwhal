
var util = require('./util');
var json = require('./json');
var fs = require('./file');

exports.main = function main() {
    // finds, reads, and analyzes packages,
    // then applies its findings (synthesizes)
    // to the loader and system.
    // this involves a breadth first search for packages
    // and packages within packages (read),
    // and performing engine-specific analysis and
    // synthesis.

    if (system.prefixes === undefined)
        throw new Error(
            "system.prefixes is undefined in packages loader. " +
            "(engine=" + system.engine + ")"
        );

    exports.load(system.prefixes);

};

exports.load = function (prefixes) {

    // the packages engine module, if it exists,
    //  performs engine-specific actions on each package.
    var packagesEngine;
    try {
        packagesEngine = require('packages-engine');
    } catch (exception) {
    }

    // depth first search of the packages tree and roots
    var catalog = {};
    var root = exports.read(prefixes, catalog);

    exports.verify(catalog);

    // a topological sort of the packages based on their
    // stated dependencies and contained engine-specific
    // components
    var packageOrder = exports.sortedPackages(catalog);

    // analysis
    var analysis = {};
    exports.analyze(analysis, packageOrder);
    // engine-specific analysis
    if (packagesEngine)
        packagesEngine.analyze(analysis, packageOrder);

    // synthesis
    exports.synthesize(analysis);
    // engine-specific synthesis
    if (packagesEngine)
        packagesEngine.synthesize(analysis);
    
    // preload modules
    analysis.preloadModules.forEach(function(id) {
        system.log.debug("Preloading module: "+id);
        try {
            require(id);
        } catch (e) {
            system.log.warn("Error preloading module: "+e);
        }
    });

    // record results
    exports.catalog = catalog;
    exports.packageOrder = packageOrder;
    exports.root = root;
    exports.analysis = analysis;
    exports.engines = analysis.engines;
    return exports;
};

/*** read
    recursively loads all package data from package.json files
    and packages/ directories, starting with the given directory,
    usually the system.packagePrefix.
*/
exports.read = function read(prefixes, catalog) {
    // construct an object graph from package json files
    // through a breadth first search of the root package and
    // its transitive packages/ directories.

    if (!catalog)
        throw new Error("must pass a package data object as the second argument to packages.read.");

    var visitedPackages = {};
    var root;

    prefixes = util.copy(prefixes);
    if (typeof prefixes == 'string')
        prefixes = [prefixes];

    // queue-based breadth-first-search of the package
    // tree starting with the "root", usually
    // system.packagePrefix
    while (prefixes.length) {
        var queue = [fs.path(prefixes.shift())];
        while (queue.length) {

            var packageDirectory = queue.shift();
            var name = packageDirectory.basename();

            // check for cyclic symbolic linkage
            var canonicalPackageDirectory = packageDirectory.canonical();
            if (Object.prototype.hasOwnProperty.call(visitedPackages, canonicalPackageDirectory)) 
                continue;
            visitedPackages[canonicalPackageDirectory] = true;

            // check for duplicate package names
            if (Object.prototype.hasOwnProperty.call(catalog, name)) {
                continue;
            }

            if (!packageDirectory.join('package.json').isFile()) {
                //system.log.warn('No package.json in ' + packageDirectory);
                continue;
            }

            var packageDatum;
            try {
                var packageDatumJson = packageDirectory.join('package.json').read().toString();
                packageDatum = json.parse(packageDatumJson || '{}');

                // look for local, user overrides
                var local = packageDirectory.join('local.json');
                if (local.isFile()) {
                    local = json.parse(local.read().toString());
                    for (var name in local) {
                        if (Object.prototype.hasOwnProperty.call(local, name)) {
                            packageDatum[name] = local[name];
                        }
                    }
                }

                name = packageDatum.name || name;
                catalog[name] = packageDatum;
                packageDatum.directory = packageDirectory.join('');

                // enqueue sub packages
                var packagesDirectories = packageDatum.packages;
                if (typeof packagesDirectories == "string")
                    packagesDirectories = [packagesDirectories];
                if (packagesDirectories === undefined)
                    packagesDirectories = ["packages"];
                packagesDirectories.forEach(function (packagesDirectory) {
                    packagesDirectory = packageDirectory.join(packagesDirectory);
                    if (packagesDirectory.isDirectory()) {
                        packagesDirectory.listPaths().forEach(function (packageDirectory) {
                            if (packageDirectory.isDirectory()) {
                                queue.push(packageDirectory);
                            }
                        });
                    }
                });

                // enqueue parent package root
                var parents = packageDatum.parent;
                if (parents !== null) {
                    if (typeof parents == "string")
                        parents = [parents];
                    if (parents === undefined)
                        parents = ["parent"];
                    parents.forEach(function (parent) {
                        parent = packageDirectory.join('').resolve(parent);
                        if (parent.isDirectory()) {
                            prefixes.push(parent);
                        }
                    });
                }

                // the first package we encounter gets
                // top-billing, the root package
                if (!root)
                    root = packageDatum;

            } catch (exception) {
                system.log.error("Could not load package '" + name + "'. " + exception);
            }

        }
    }

    return root;
};

/*** verify
    scans a package object for missing dependencies and throws away
    any package that has unmet dependencies.
*/
exports.verify = function verify(catalog) {
    for (var name in catalog) {
        if (Object.prototype.hasOwnProperty.call(catalog, name)) {
            try {
                scan(catalog, name);
            } catch (exception) {
                if (typeof exception == "string") {
                } else {
                    throw exception;
                }
            }
        }
    }
};

var scan = function scan(catalog, name) {
    var packageDatum = catalog[name];
    if (!packageDatum)
        throw name;
    try {
        if (packageDatum.dependencies) {
            packageDatum.dependencies.forEach(function (dependency) {
                scan(catalog, dependency);
            });
        }
    } catch (exception) {
        if (typeof exception == "string")
            system.log.error(
                'Threw away package ' + name +
                ' because it depends on ' + exception +
                '.'
            );
        delete catalog[name];
        throw name;
    }
};

/*** sortedPackages
    returns an array of packages in order from the most
    dependent to least dependent, sorted based on
    their transitive dependencies.
*/
exports.sortedPackages = function sortedPackages(info) {
    var order = topo(info);
    var sorted = [];
    for (var i = 0; i < order.length; i++)
        sorted[i] = info[order[i]];
    return sorted;
};

var topo = function topo(graph) {
    var sorted = [],
        visited = {};
    for (var name in graph) {
        if (
            Object.prototype.hasOwnProperty.call(graph, name) &&
            !Object.prototype.hasOwnProperty.call(visited, name)
        ) {
            sorted.push.apply(sorted, _topo(graph, name, visited));
        }
    }
    return sorted;
};

var _topo = function _topo(graph, name, visited) {
    var node = graph[name];
    if (Object.prototype.hasOwnProperty.call(visited, node))
        return [];
    visited[name] = true;
    var sorted = [];
    if (graph[name] === undefined) {
        system.log.error('"' + name + '" package does not exist.');
    }
    var dependencies = graph[name].dependencies || [];
    for (var i = 0; i < dependencies.length; i++) {
        var dependency = dependencies[i];
        if (Object.prototype.hasOwnProperty.call(visited, dependency))
            continue;
        visited[dependency] = true;
        sorted.push.apply(sorted, _topo(graph, dependency, visited));
    }
    sorted.push(name);
    return sorted;
};

/*** analyze
    constructs prioritized top-level module paths
    based on the given sorted package array.    
*/
exports.analyze = function analyze(analysis, catalog) {
    analysis.libPaths = [];
    analysis.preloadModules = [];
    analysis.engines = {};
    catalog.forEach(function (info) {

        // libraries
        if (typeof info.lib == 'string')
            info.lib = [info.lib];
        if (!info.lib)
            info.lib = ['lib'];

        // resolve the lib paths
        for (var i = 0; i < info.lib.length; i++) {
            info.lib[i] = info.directory.resolve(info.lib[i]);
        }

        if (!info.engine) {

            // engines
            var engines = 'engines';
            var engineLibs = [];
            if (info.engines)
                engines = info.engines;
            system.engines.forEach(function (engine) {
                var engineDir = info.directory.join(engines, engine, 'lib');
                if (engineDir.isDirectory()) 
                    engineLibs.push(engineDir);
            });

            for (var i = 0; i < engineLibs.length; i++) {
                engineLibs[i] = info.directory.resolve(engineLibs[i]);
            }

            analysis.libPaths.unshift.apply(
                analysis.libPaths,
                engineLibs.concat(info.lib)
            );

        } else {
            // the package is an engine.  install its lib path
            //  if it is active.

            var name = info.engine || info.name;
            analysis.engines[name] = info;
            if (util.has(system.engines, name)) {
                analysis.libPaths.unshift.apply(
                    analysis.libPaths,
                    info.lib
                );
            }

        }
        
        // add any preload librarys to analysis
        if (info.preload)
            analysis.preloadModules.unshift.apply(analysis.preloadModules, info.preload);
    });
};

/*** synthesize
    applies the results of the analysis on the current
    execution environment.
*/
exports.synthesize = function synthesize(analysis) {
    exports.addJsPaths(analysis.libPaths);
};

/*** addJsPaths
*/
exports.addJsPaths = function addJsPaths(jsPaths) {
    // add package paths to the loader
    if (require.paths)
        require.paths.splice.apply(
            require.paths, 
            [0, require.paths.length].concat(jsPaths)
        );
};

