
var fs = require('./file');
var system = require('./system');

/*** analyze
*/
exports.analyze = function (analysis, sortedPackages) {
    var javaPaths = analysis.javaPaths = []
    sortedPackages.forEach(function (packageData) {
        /* migration */
        if (packageData.jars)
            packageData.java = packageData.jars;
        /* /migration */
        if (typeof packageData.java == 'string')
            packageData.java = [packageData.java];
        if (!packageData.java)
            packageData.java = [];
        for (var i = 0; i < packageData.java.length; i++)
            packageData.java[i] = packageData.directory.resolve(packageData.java[i]);
        /* new approach */
        var jarsDirectory = packageData.directory.join('jars');
        if (jarsDirectory.isDirectory()) {
            jarsDirectory.listPaths().forEach(function (jarDirectory) {
                packageData.java.push(jarDirectory);
            });
        }
        javaPaths.unshift.apply(javaPaths, packageData.java);
    });
};

/*** synthesize
*/
exports.synthesize = function (analysis) {
    exports.addJavaPaths(analysis.javaPaths);
};

var loader = Packages.java.lang.ClassLoader.getSystemClassLoader();
// so that replacing Packages does not implicitly dispose of the
//  only means of creating new Packages objects.

/*** addJavaPaths
*/
exports.addJavaPaths = function addJavaPaths(javaPaths) {
    if (!javaPaths || javaPaths.length === 0)
        return;
    // after reinstalling Packages once, the Packages object
    // is no longer a Packages constructor function.
    // If that's the case, abandone hope.
    if (typeof Packages == "object")
        return;
        
    /* set up jar loader */
    var urls = Packages.java.lang.reflect.Array.newInstance(java.net.URL, javaPaths.length);
    for (var i = 0; i < javaPaths.length; i++) {
        urls[i] = new Packages.java.net.URL('file://' + javaPaths[i]);
    };
    loader = new Packages.java.net.URLClassLoader(urls, loader);

    try {
        /* intall jar loader */
        //Packages.java.lang.Thread.currentThread().setContextClassLoader(loader);
        var context = Packages.org.mozilla.javascript.Context.getCurrentContext();
        context.setApplicationClassLoader(loader);
        // must explicitly be made global when each module has it's own scope
        global.Packages = new Packages(loader);
        installed = true;
    } catch (e) {
        print("warning: couldn't install jar loader: " + e);
    }
};

