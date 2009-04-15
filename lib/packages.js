
var json = require('./json');

/*** readPackages
*/
exports.readPackages = function (packageDirectory) {
    /* construct an object graph from package json files */
    var packagesData = {};
    packagesDirectory.list().forEach(function (packageName) {
        var packageJson = packagesDirectory.join(packageName, 'package.json');
        if (packageJson.exists()) {
            var packageData = json.parse(packageJson.read());
            packageData.dir = packageJson.resolve('.');
            packagesData[packageName] = packageData;
        }
    });
    return packagesData;
};

/*** sortedPackages
*/
exports.sortedPackages = function (packageData) {
    var order = topo(packageData);
    var sorted = [];
    for (var i = 0; i < order.length; i++)
        sorted[i] = packageData[order[i]];
    return sorted;
};

/*** analyze
*/
exports.analyze = function (analysis, packagesData) {
    var jsPaths = analysis.jsPaths = []
    packagesData.forEach(function (packageData) {
        if (typeof packageData.js == 'string')
            packageData.js = [packageData.js];
        if (!packageData.js)
            packageData.js = ['lib'];
        for (var i = 0; i < packageData.js.length; i++)
            packageData.js[i] = packageData.dir.resolve(packageData.js[i]);
        jsPaths.unshift.apply(jsPaths, packageData.js);
    });
};

/*** synthesize
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

var packagesPlatform;
try {
    packagesPlatform = require('./packages-platform');
} catch (exception) {
}
if (packagesPlatform) {
    var packagesDirectory = packagesPlatform.getPackagesDirectory();
    var packageData = exports.readPackages(packagesDirectory);
    var sortedPackages = exports.sortedPackages(packageData);
    var analysis = {};
    exports.analyze(analysis, sortedPackages);
    packagesPlatform.analyze(analysis, sortedPackages);
    exports.synthesize(analysis);
    packagesPlatform.synthesize(analysis);
}


/* functions */

function topo(graph) {
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
}

function _topo(graph, name, visited) {
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
}

