
var fs = require('./file');
var sys = require('./platform');

/* construct an object graph from package json files */
var packages = {};
var packagesDir = fs.path(sys.ENV.NARWHAL_HOME).join('packages');
packagesDir.list().forEach(function (packageName) {
    var packageJson = packagesDir.join(packageName, 'package.json');
    if (packageJson.exists()) {
        var packageData = eval('(' + packageJson.read() + ')');
        packageData.dir = packageJson.resolve('.');
        packages[packageName] = packageData;
    }
});

/* create js and jar paths from package data */
var packageOrder = topo(packages);
var jsPaths = [];
var jarPaths = [];
for (var i = 0; i < packageOrder.length; i++) {
    var packageData = packages[packageOrder[i]];
    jsPaths.unshift(packageData.dir.resolve(packageData.js || 'lib'));
    var packageJars = packageData.jars || [];
    for (var j = 0; j < packageJars.length; j++) {
        packageJars[j] = packageData.dir.resolve(packageJars[j]).absolute();
    }
    jarPaths.unshift.apply(jarPaths, packageJars);
}

/* set up jar loader */
var loader = Packages.java.lang.ClassLoader.getSystemClassLoader();
var urls = Packages.java.lang.reflect.Array.newInstance(java.net.URL, jarPaths.length);
for (var i = 0; i < jarPaths.length; i++) {
    urls[i] = new Packages.java.net.URL('file://' + jarPaths[i]);
};
var loader = new Packages.java.net.URLClassLoader(urls, loader);

/* intall jar loader */
Packages.java.lang.Thread.currentThread().setContextClassLoader(loader);
var context = Packages.org.mozilla.javascript.Context.getCurrentContext();
context.setApplicationClassLoader(loader);
Packages = new Packages(loader);

/* add package paths to the loader */
require.loader.setPaths(jsPaths.concat(require.loader.getPaths()));


/* functions */

function topo(graph) {
    var sorted = [];
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

