
var json = require('./json');
var fs = require('./file');
var system = require('./system');

function main () {
    var packagesPlatform;
    try {
        packagesPlatform = require('packages-platform');
    } catch (exception) {
    }
    var packagesData = exports.readPackages(system.prefix);
    var sortedPackages = exports.sortedPackages(packagesData);
    var analysis = {};
    exports.analyze(analysis, sortedPackages);
    if (packagesPlatform)
        packagesPlatform.analyze(analysis, sortedPackages);
    exports.synthesize(analysis);
    if (packagesPlatform)
        packagesPlatform.synthesize(analysis);
}

/*** readPackages
    recursively loads all package data from package.json files
    and packages/ directories, starting with the given directory,
    usually the system.prefix.
*/
exports.readPackages = function (packageDirectory, packagesData, visitedPackages) {
    /* construct an object graph from package json files */

    if (!packagesData)
        packagesData = {};
    if (!visitedPackages)
        visitedPackages = {};

    packageDirectory = fs.path(packageDirectory);
    var name = packageDirectory.basename();

    /* check for cyclic symbolic linkage */
    var canonicalPackageDirectory = packageDirectory.canonical();
    if (Object.prototype.hasOwnProperty.call(visitedPackages, canonicalPackageDirectory)) 
        return packagesData;
    visitedPackages[canonicalPackageDirectory] = true;

    /* check for duplicate package names */
    if (Object.prototype.hasOwnProperty.call(packagesData, name)) {
        system.log.warn(
            "Package name collision ignored: " + name + " " + 
            "(" + packageDirectory + ", canonically " + canonicalPackageDirectory + ")"
        );
        return packagesData;
    }

    if (!packageDirectory.join('package.json').isFile()) {
        system.log.warn('No package.json in ' + packageDirectory);
        return packagesData;
    }

    try {
        var packageDatum =
            packagesData[name] =
            json.parse(packageDirectory.join('package.json').read().toString());
        packageDatum.directory = packageDirectory.join('');

        /* sub packages */
        var packagesDirectory = packageDirectory.join(packageDatum.packages || 'packages');
        if (packagesDirectory.isDirectory()) {
            packagesDirectory.list().forEach(function (packageName) {
                var packageDirectory = packagesDirectory.join(packageName);
                if (packagesDirectory.join(packageName).isDirectory()) {
                    exports.readPackages(
                        packagesDirectory.join(packageName),
                        packagesData,
                        visitedPackages
                    );
                }
            });
        }

    } catch (exception) {
        system.log.error("Could not load package '" + packageName + "'. " + exception);
    } finally {
        return packagesData;
    }

};

/*** verify
    scans a package object for missing dependencies and throws away
    any package that has unmet dependencies.
*/
exports.verify = function (packageData) {
    for (var name in packageData) {
        if (Object.prototype.hasOwnProperty.call(packageData, name)) {
            try {
                scan(packageData, name);
            } catch (exception) {
            }
        }
    }
};

var scan = function (packageData, name) {
    var packageDatum = packageData[name];
    if (!packageDatum)
        throw name;
    try {
        if (packageDatum.dependencies) {
            packageDatum.dependencies.forEach(function (dependency) {
                scan(packageData, dependency);
            });
        }
    } catch (exception) {
        if (typeof exception == "string")
            system.log.error(
                'Threw away package ' + name +
                ' because it depends on ' + exception +
                '.'
            );
        delete packageData[name];
        throw name;
    }
};

/*** sortedPackages
    returns an array of packages in order from the most
    dependent to least dependent, sorted based on
    their transitive dependencies.
*/
exports.sortedPackages = function (packageData) {
    var order = topo(packageData);
    var sorted = [];
    for (var i = 0; i < order.length; i++)
        sorted[i] = packageData[order[i]];
    return sorted;
};

var topo = function (graph) {
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

var _topo = function (graph, name, visited) {
    var node = graph[name];
    if (Object.prototype.hasOwnProperty.call(visited, node))
        return [];
    visited[name] = true;
    var sorted = [];
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
exports.analyze = function (analysis, packagesData) {
    var jsPaths = analysis.jsPaths = []
    packagesData.forEach(function (packageData) {

        /* platforms */
        var platforms = 'platforms';
        if (packageData.platforms)
            platforms = packageData.platforms;
        system.platforms.forEach(function (platform) {
            var platformDir = packageData.directory.join('platforms', platform);
            if (platformDir.isDirectory()) 
                jsPaths.push(platformDir);
        });

        /* libraries */
        if (typeof packageData.js == 'string')
            packageData.js = [packageData.js];
        if (!packageData.js)
            packageData.js = ['lib'];
        for (var i = 0; i < packageData.js.length; i++) {
            packageData.js[i] = packageData.directory.resolve(packageData.js[i]);
        }

        jsPaths.unshift.apply(jsPaths, packageData.js);
    });
};

/*** synthesize
    applies the results of the analysis on the current
    execution environment.
*/
exports.synthesize = function (analysis) {
    exports.addJsPaths(analysis.jsPaths);
};

/*** addJsPaths
*/
exports.addJsPaths = function (jsPaths) {
    /* add package paths to the loader */
    require.loader.setPaths(jsPaths.concat(require.loader.getPaths()));
};

main();

