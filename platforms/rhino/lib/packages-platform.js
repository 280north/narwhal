
var fs = require('./file');
var system = require('./system');

/*** analyze
*/
exports.analyze = function (analysis, sortedPackages) {
    var javaPaths = analysis.javaPaths = []
    sortedPackages.forEach(function (packageData) {
        var jars = packageData.jars;
        if (typeof jars == "string")
            jars = [jars];
        if (jars === undefined)
            jars = ["jars"];
        jars.forEach(function (jars) {
            jars = packageData.directory.resolve(jars);
            if (jars.isDirectory()) {
                jars.list().forEach(function (jar) {
                    jar = jars.join(jar);
                    if (jar.search(/\.jar$/)) {
                        javaPaths.push(jar);
                    }
                });
            }
        });
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
var PackageType = Packages;

/*** addJavaPaths
*/
exports.addJavaPaths = function addJavaPaths(javaPaths) {
    if (!javaPaths || javaPaths.length === 0)
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
    } catch (e) {
        print("warning: couldn't install jar loader: " + e);
    }
};

