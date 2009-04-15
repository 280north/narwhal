
var fs = require('./file');
var system = require('./platform');

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
            packageData.java[i] = packageData.dir.resolve(packageData.java[i]);
        javaPaths.unshift.apply(javaPaths, packageData.java);
    });
};

/*** synthesize
*/
exports.synthesize = function (analysis) {
    exports.addJavaPaths(analysis.javaPaths);
};

var loader = Packages.java.lang.ClassLoader.getSystemClassLoader();
var PackageType = Packages;

/*** addJavaPaths
*/
exports.addJavaPaths = function addJavaPaths(javaPaths) {
    /* set up jar loader */
    var urls = Packages.java.lang.reflect.Array.newInstance(java.net.URL, javaPaths.length);
    for (var i = 0; i < javaPaths.length; i++) {
        urls[i] = new Packages.java.net.URL('file://' + javaPaths[i]);
    };
    loader = new Packages.java.net.URLClassLoader(urls, loader);

    /* intall jar loader */
    //Packages.java.lang.Thread.currentThread().setContextClassLoader(loader);
    var context = Packages.org.mozilla.javascript.Context.getCurrentContext();
    context.setApplicationClassLoader(loader);
    Packages = new PackageType(loader);
};

