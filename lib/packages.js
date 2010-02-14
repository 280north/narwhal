
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- cadorn Christoph Dorn

var system = require('./system');
var util = require('./util');
var json = require('./json');
var fs = require('./file');
var URI = require('./uri');

exports.resourceIfExists = function (path) {
    for (var i = 0, length = exports.order.length; i < length; i++) {
        var info = exports.order[i];
        var resource = info.directory.join(path);
        if (resource.exists())
            return resource;
    }
};

exports.resource = function (path) {
    var resource = exports.resourceIfExists(path);
    if (resource) {
        return resource;
    }
    throw new Error("Could not locate " + path + " in any package.");
};

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

    system.packages = system.packages || [];

    exports.load(system.packages.concat(system.prefixes));

};

exports.load = function (prefixes, options) {

    // the packages engine module, if it exists,
    //  performs engine-specific actions on each package.
    var packagesEngine;
    try {
        packagesEngine = require('packages-engine');
    } catch (exception) {
    }

    var catalog = {},
        usingCatalog = require.loader.usingCatalog || {};
    
    // depth first search of the packages tree and roots
    var root = exports.read(prefixes, catalog, usingCatalog, options);

    exports.verify(catalog);

    // normalize data in the catalog, like Author objects
    exports.normalize(catalog);

    // a topological sort of the packages based on their
    // stated dependencies and contained engine-specific
    // components
    var order = exports.sortedPackages(catalog);

    // analysis
    var analysis = {};
    exports.analyze(analysis, order);
    // engine-specific analysis
    if (packagesEngine)
        packagesEngine.analyze(analysis, order);

    // synthesis
    exports.synthesize(analysis);
    // engine-specific synthesis
    if (packagesEngine)
        packagesEngine.synthesize(analysis);
    
    // update usingCatalog in loader
    require.loader.usingCatalog = usingCatalog;

    // preload modules
    analysis.preloadModules.forEach(function(id) {
        system.log.debug("Preloading module: "+id);
        try {
            require(id);
        } catch (e) {
            system.log.warn("Error preloading module: " + id + " " + e);
        }
    });

    // record results
    exports.catalog = catalog;
    exports.usingCatalog = usingCatalog;
    exports.order = order;
    exports.root = root;
    exports.analysis = analysis;
    exports.engines = analysis.engines;
    return exports;
};

/*** read
    recursively loads all package data from package.json files
    and packages/ directories.
*/
exports.read = function read(prefixes, catalog, usingCatalog, options) {
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
    // tree starting with the "root"
    while (prefixes.length) {
        var queue = [fs.path(prefixes.shift())];
        while (queue.length) {

            var item = queue.shift(),
                packageDirectory,
                name,
                dependencyInfo = null;

            if(util.isArrayLike(item)) {
                packageDirectory = item[0];
                dependencyInfo = item[1];
                name = dependencyInfo.name;
            } else {
                packageDirectory = item;
                name = packageDirectory.basename();
            }
            
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
                var packageDatumJson = packageDirectory.join('package.json').read({"charset": "UTF-8"});
                packageDatum = json.parse(packageDatumJson || '{}');
                
                // look for local, user overrides
                var local = packageDirectory.join('local.json');
                if (local.isFile()) {
                    local = json.parse(local.read({"charset": "UTF-8"}));
                    for (var name in local) {
                        if (Object.prototype.hasOwnProperty.call(local, name)) {
                            packageDatum[name] = local[name];
                        }
                    }
                }

                // overlay local package file
                var localOverlay = packageDirectory.join('package.local.json');
                if (localOverlay.isFile()) {
                    util.deepUpdate(packageDatum, json.parse(localOverlay.read().toString()));
                }
                
                // If package declares it is a "using" package we do not load it into the system catalog.
                // This feature is important as using packages do not namespace their modules in a way
                // that is compatible with system packages.
                if(util.has(packageDatum, "type") && packageDatum.type=="using") {
                    continue;
                }
                
                // scan the <package>/using directory for "using" packages
                // TODO: This should run only *once* for the SEA package as "using" packages
                //       should only be declared in <sea>/using
                //       To make this work we need a way to identify the SEA package
                //       in a reliable and consistent fashion. The SEA environment variable could?
                exports.readUsing(options, usingCatalog, packageDirectory.join("using"));

                // rewrite the package name to using/<name>/package.json if it is a using package                    
                if(dependencyInfo) {
                    name = dependencyInfo.name;
                } else {
                    // set name based on package*.json "name" property
                    name = packageDatum.name || name;
                }
                catalog[name] = packageDatum;
                packageDatum.directory = packageDirectory.join('');

                // add this system package to the usingCatalog
                exports.updateUsingCatalog(options, usingCatalog, packageDirectory, name, packageDatum);

                // if a dependency is referring to a 'using' package ID we add the
                // package being referenced to the system package catalog
                if(packageDatum.dependencies) {
                    packageDatum.dependencies.forEach(function(dependency) {
                        if(Object.prototype.hasOwnProperty.call(usingCatalog, dependency) &&
                           !Object.prototype.hasOwnProperty.call(catalog, dependency)) {

                            queue.push([
                                usingCatalog[dependency].directory,
                                {
                                    "name": dependency
                                }
                            ]);
                        }
                    });
                }
                
                // normalize authors
                if (packageDatum.author)
                    packageDatum.author = new exports.Author(packageDatum.author);
                if (!packageDatum.contributors)
                    packageDatum.contributors = [];
                packageDatum.contributors = packageDatum.contributors.map(function (contributor) {
                    return new exports.Author(contributor);
                });

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
        if (require.debug) {
            if (typeof exception == "string")
                system.log.error(
                    "Threw away package " + name +
                    " because it depends on " + exception +
                    "."
                );
        }
        delete catalog[name];
        throw name;
    }
};

/*** sortedPackages
    returns an array of packages in order from the most
    dependent to least dependent, sorted based on
    their transitive dependencies.
*/
exports.sortedPackages = function (graph) {
    var sorted = [];
    var arrived = {};
    var departed = {};
    var t = 0;

    // linearize the graph nodes
    var nodes = [];
    for (var name in graph) {
        if (Object.prototype.hasOwnProperty.call(graph, name)) {
            graph[name].name = name;
            nodes.push(graph[name]);
        }
    }

    while (nodes.length) {
        var node = nodes.shift();
        var name = node.name;
        if (Object.prototype.hasOwnProperty.call(arrived, name))
            continue;

        var stack = [node];
        while (stack.length) {

            var node = stack[stack.length - 1];
            var name = node.name;

            if (Object.prototype.hasOwnProperty.call(arrived, name)) {
                departed[name] = t++;
                sorted.push(stack.pop());
            } else {
                arrived[name] = t++;
                var dependencies = node.dependencies || [];
                var length = dependencies.length;
                for (var i = 0; i < length; i++) {
                    var dependency = dependencies[i];
                    if (Object.prototype.hasOwnProperty.call(arrived, dependency)) {
                        if (!Object.prototype.hasOwnProperty.call(departed, dependency)) {
                            throw new Error("Dependency cycle detected among packages: " + stack.map(function (node) {
                                return node.name;
                            }).join(" -> ") + " -> " + dependency);
                        }
                        continue;
                    }
                    if (!Object.prototype.hasOwnProperty.call(graph, dependency)) {
                        if (require.debug) {
                            print(
                                "Throwing away package '" + name +
                                "' because it depends on the package '" + dependency +
                                "' which is not installed."
                            );
                        }
                        delete graph[name];
                        continue;
                    }
                    stack.push(graph[dependency]);
                }
            }

        };
    }

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
                
            if(!system.engines)
                throw "No system.engines set";

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
        if (info.preload) {
            if (typeof info.preload == "string")
                info.preload = [info.preload];
            analysis.preloadModules.unshift.apply(analysis.preloadModules, info.preload);
        }
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

exports.normalizePackageDescriptor = function(descriptor) {
    if(!descriptor) return descriptor;
    var uri,
        path = "";
    if(util.has(descriptor, "location") && descriptor.location) {
        uri = URI.parse(descriptor.location);
        // location URL without trailing "/"
        // this will convert http://.../package to http://.../package/
        // this will convert http://.../package.zip to http://.../package.zip/
        if(uri.file) {
            uri = URI.parse(descriptor.location + "/");
        }
        if(util.has(descriptor, "path")) path = descriptor.path;
    } else
    if(util.has(descriptor, "catalog") && descriptor.catalog) {
        uri = URI.parse(descriptor.catalog);
        if(util.has(descriptor, "name")) path = descriptor.name;
    } else {
        throw new Error("invalid package descriptor");
    }
    var id = fs.Path(uri.domain + uri.path).dirname();
    if(path) id = id.join(path);
    id = id.valueOf();
    if(id.charAt(0)=="/") id = id.substr(1);
    return id.replace(/\\/g, "/");	// windows compatibility
}

exports.readUsing = function(options, usingCatalog, basePath, subPath) {
    subPath = subPath || fs.Path("./");

    var path = basePath.join(subPath);

    if(!path.isDirectory()) {
        return;
    }
        
    // when a package.json file is encountered we have arrived at a package.
    // based on the path we can determine the package name (top-level id)
    if(path.join("package.json").exists()) {

        var packageDatumJson = path.join("package.json").read().toString();
        var packageDatum = json.parse(packageDatumJson || '{}');

        // overlay local package file
        var localOverlay = path.join('package.local.json');
        if (localOverlay.isFile()) {
            util.deepUpdate(packageDatum, json.parse(localOverlay.read().toString()));
        }
        
        var id = subPath.valueOf().replace(/\\/g, "/");	// windows compatibility
        
        exports.updateUsingCatalog(options, usingCatalog, path, id, packageDatum);
        
        // once a package is encountered we do not traverse deeper
    } else {
        // we did not find a package - traverse the path deeper
        path.listPaths().forEach(function(dir) {
            exports.readUsing(options, usingCatalog, basePath, subPath.join(dir.basename()));
        });
    }
}

exports.updateUsingCatalog = function(options, usingCatalog, path, id, packageDatum) {
    if(!util.has(usingCatalog, id)) {
        usingCatalog[id] = {
            "libPath": path.join("lib"),
            "directory": path,
            "packages": {}
        };
    }
    if(util.has(packageDatum, "using")) {
        util.every(packageDatum.using, function(pair) {
            usingCatalog[id]["packages"][pair[0]] = exports.normalizePackageDescriptor(pair[1]);
        });
    }
    if(util.has(options, "includeBuildDependencies") &&
       options.includeBuildDependencies &&
       util.has(packageDatum, "build") &&
       util.has(packageDatum.build, "using")) {

        util.every(packageDatum.build.using, function(pair) {
            usingCatalog[id]["packages"][pair[0]] = exports.normalizePackageDescriptor(pair[1]);
        });
    }
}


/*** normalize
*/
exports.normalize = function (catalog) {
    for (var name in catalog) {
        if (Object.prototype.hasOwnProperty.call(catalog, name)) {
            exports.normalizePackage(catalog[name]);
        }
    }
};

/*** normalizePackage
*/
exports.normalizePackage = function (info) {

    var names = [];
    // normalize authors
    if (!info.contributors)
        info.contributors = [];
    info.contributors = info.contributors.map(function (contributor) {
        var author = new exports.Author(contributor);
        names.push(author.name)
        return author;
    });

    ['maintainer', 'author'].forEach(function (name) {
        if (!info[name])
            return;
        info[name] = new exports.Author(info[name]);
        if (names.indexOf(info[name].name) < 0)
            info.contributors.unshift(info[name]);
    });

    info.dependencies = info.dependencies || [];

    info.version = exports.Version(info.version);

};

/*** Author
*/
exports.Author = function (author) {
    if (!(this instanceof exports.Author))
        return new exports.Author(author);
    if (typeof author == "string") {
        var match = author.match(exports.Author.regexp);
        this.name = util.trim(match[1]);
        this.url = match[2];
        this.email = match[3];
    } else {
        this.name = author.name;
        this.url = author.url;
        this.email = author.email;
    }
};

exports.Author.prototype.toString = function () {
    return [
        this.name,
        this.url ? "(" + this.url + ")" : undefined,
        this.email ? "<" + this.email + ">" : undefined
    ].filter(function (part) {
        return !!part;
    }).join(' ');
};

exports.Author.regexp = new RegExp(
    "(?:" +
        "([^\\(<]*)" +
        " ?" + 
    ")?" +
    "(?:" +
        "\\(" +
            "([^\\)]*)" +
        "\\)" +
    ")?" +
    " ?" +
    "(?:<([^>]*)>)?"
);

/**
*/
exports.Version = function (version) {
    if (typeof version == "undefined")
        return [];
    if (typeof version == "string")
        return version.split(".");
    return version;
};

