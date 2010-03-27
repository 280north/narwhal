
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var FS = require("file");
var TUSK = require("../tusk");
var UTIL = require("util");
var URI = require("uri");
var JSON = require("json");
var ASSERT = require("assert");
var PACKAGES = require("packages");
var stream = require("term").stream;

exports.defaultSources = {"includes": [
    "http://github.com/280north/narwhal/raw/master/catalog-2.json"
]};

/**
 * Consolidates a catalog from its transitive "includes" and "sources" and
 * writes the results to the current sea's catalog, ".tusk/catalog.json", which
 * will be used for all package searches and installation.
 *
 * Takes a single options object as an argument that may contain the following
 * options:
 *
 * @param {Object} catalog optional root catalog object, usually parsed out of
 * a "sources.json" file, like ".tusk/sources.json" or a package-management
 * "sources.json" with repository source information.  By default, uses the
 * sea's ".tusk/sources.json".
 * {Boolean} useCache optionally whether to use the disk cache,
 * ".tusk/http", for fetching transitively included catalog "catalog.json"
 * files and package descriptor "package.json" files, to avoid making HTTP
 * requests where possible.  By default this is "false" and fresh copies of
 * all files are downloaded and cached.
 * @param {Path} output a path object on which to write the resulting catalog.
 * @param {Path} input a path object from which to read the root catalog sources.
 * @param {Log} log an optional logger object that conforms the the exported
 * Log API for logging messages to a console or GUI log viewer.  The "Log"
 * object must support "downloading(url)", "writing(url)",
 * "catalog(url):CatalogLog", and "error(message)" message methods, and the
 * "CatalogLog" must additionally support "source(name)" message.  The logger
 * defaults to a terminal stream logger.
 * @returns this module for chaining.
 */

exports.update = function (options) {
    var log = options.log || new exports.Log();
    if (options.useDefaultSources) {
        options.catalog = exports.defaultSources;
    } else if (options.input) {
        options.catalog = exports.readCatalog(options.input);
    } else {
        options.catalog = exports.getSources();
    }
    catalog = exports.consolidate(options.catalog, options.useCache, log);

    // write .tusk/catalog.json
    var output = options.output || TUSK.getCatalogPath();
    log.writing(output);
    exports.writeCatalog(output, catalog);
    
    return exports;
};

exports.updatePackage = function (packageName, options) {
    exports.updatePackages([packageName], options);
};

exports.updatePackages = function (packageNames, options) {
    var log = options.log || new exports.Log();
    if (options.useDefaultSources)
        options.catalog = exports.defaultSources;
    else
        options.catalog = exports.readCatalog(options.input);
    var catalog = exports.consolidate(options.catalog, true, log);
    var packages = catalog.packages || {};
    var sources = catalog.sources || {};
    var useCache = options.useCache;

    packageNames.forEach(function (packageName) {
        var source = sources[packageName] || packages[packageName].source;
        var info = exports.sourceToDescriptor(
            packageName,
            source,
            catalog,
            useCache,
            log
        );
        if (info)
            packages[packageName] = info;
    });

    // write .tusk/catalog.json
    var output = options.output || TUSK.getCatalogPath();
    log.writing(output);
    exports.writeCatalog(output, catalog);
    
    return exports;
};

/**
 * Takes a root catalog Object and consolidate its transitive "includes" and
 * "sources" into a single catalog.
 *
 * @param {Object} catalog optional root catalog object, usually parsed out of
 * a "sources.json" file, like ".tusk/sources.json" or a package-management
 * "sources.json" with repository source information.  By default, uses the
 * sea's ".tusk/sources.json".
 * @param {Boolean} useCache optionally whether to use the disk cache,
 * ".tusk/http", for fetching transitively included catalog "catalog.json"
 * files and package descriptor "package.json" files, to avoid making HTTP
 * requests where possible.  By default this is "false" and fresh copies of all
 * files are downloaded and cached.
 * @param {Log} log an optional logger object that conforms the the exported
 * Log API for logging messages to a console or GUI log viewer.  The "Log"
 * object must support "downloading(url)", "writing(url)",
 * "catalog(url):CatalogLog", and "error(message)" message methods, and the
 * "CatalogLog" must additionally support "source(name)" message.  The logger
 * defaults to a terminal stream logger.
 * @returns a single catalog "Object" with only "packages".
 */
exports.consolidate = function (catalog, useCache, log) {
    if (!catalog)
        catalog = exports.getSources();
    if (!log)
        log = new exports.Log();
    // download all sub-catalogs, transitively.
    // they are returned in topological sort order
    // by nature of the discovery algorithm
    var catalogs = exports.getCatalogs(catalog, undefined, undefined, useCache, log);
    // in every catalog,
    var packages = {};
    catalogs.forEach(function (subcatalog) {
        var catalogLog = log.catalog(subcatalog.url);
        subcatalog.sources = subcatalog.sources || {};
        subcatalog.packages = subcatalog.packages || {};
        // normalize the source, which may involve
        // grabbing its descriptor from the web
        // for each source
        UTIL.forEachApply(subcatalog.sources, function (name, source) {
            // download a package.json and inject it into the
            // package add the package.json location and source
            // location
            var descriptor = exports.sourceToDescriptor(
                name, source, catalog, useCache, log
            );
            subcatalog.packages[name] = descriptor;
        });
        UTIL.forEachApply(subcatalog.packages, function (name, descriptor) {
            packages[name] = descriptor;
        });
    });

    // normalize packages
    PACKAGES.normalize(packages);

    catalog = {
        "!": "This file is generated by 'tusk update'.  You can customize your catalog sources by editing .tusk/sources.json and running 'tusk update'.",
        "version": TUSK.catalogVersion,
        "packages": packages
    };

    return catalog;
};

/**
 */
exports.sourceToDescriptor = function (name, source, catalog, useCache, log) {

    source.packageName = name;

    // normalize the source, based on its type
    sourceTypes[source.type](source);

    // download a package descriptor if necessary
    if (source.descriptor) {
        descriptor = UTIL.deepCopy(source.descriptor);
    } else {
        var httpStore = TUSK.getHttpStore();

        if (!useCache) {
            try {
                log.downloading(source.descriptorUrl);
                httpStore.download(source.descriptorUrl);
            } catch (exception) {
                log.error(
                    "Unable to download a fresh copy of " +
                    source.descriptorUrl +
                    ".  Trying to use cache.  Reason: " +
                    exception
                );
            }
        }

        try {
            var json = httpStore.read(source.descriptorUrl, {"charset": "UTF-8"});
        } catch (exception) {
            log.error("Unable to read " + source.descriptorUrl + ".");
            return;
        }

        try {
            descriptor = JSON.decode(json);
        } catch (exception) {
            log.error("Unable to parse " + source.descriptorUrl + ".");
            return;
        }
    }

    descriptor.name = name;
    descriptor.descriptorUrl = source.descriptorUrl;
    descriptor.packageUrl = source.url;
    descriptor.packageArchive = source.archive;
    descriptor.source = source;
    delete descriptor.source.descriptor;

    return descriptor;

};

var sourceTypes = exports.sourceTypes = {};

sourceTypes.github = function (source) {
    var name = source.name || source.packageName,
        ref = source.ref || "master"
    if (!source.user)
        throw new Error("package source " + util.enquote(name) + " did not have a github user name");
    var project = source.user + '/' + name;
    source.descriptorUrl = "http://github.com/" + project + "/raw/" + ref + "/package.json";
    source.url = 'http://github.com/' + source.user + '/' + name + '/zipball/' + ref;
    source.archive = "zip";
};

sourceTypes.inline = function (source) {
    if (!source.descriptor && !source.descriptorUrl)
        throw new Error("Inline-type sources must provide either a descriptor or descriptorUrl.");
    if (!source.url && !(source.descriptor && source.descriptor.packageUrl))
        throw new Error("Inline-type sources must provide a package URL either in the source or the package descriptor.");
};

/**
 * @returns the current sea's catalog, parsed from
 * ".tusk/sources.json" or defaulting to a catalog that just
 * includes Narwhal's default remote catalog.
 */
exports.getSources = function () {
    // read .tusk/sources.json
    // create .tusk/sources.json from default if necessary
    var tuskDirectory = TUSK.getTuskDirectory();
    var sourcesFile = tuskDirectory.join('sources.json').canonical();
    if (!sourcesFile.exists()) {
        sources = exports.defaultSources;
    } else {
        sources = JSON.decode(sourcesFile.read({"charset": "UTF-8"}));
    }
    sources.url = URI.pathToUri(sourcesFile);
    return sources;
};

/**
 * @param catalogPath undefined or a String or Path to a catalog file
 * @returns the Path of a catalog file, the sea's catalog by default.
 */
exports.getCatalogPath = function (catalogPath) {
    if (!catalogPath)
        catalogPath = TUSK.getCatalogPath();
    else
        catalogPath = FS.path(catalogPath);
    return catalogPath;
};

/**
 * @param catalogPath undefined or a String or Path to a catalog file
 * @returns the contents of a catalog file, the sea's catalog by default.
 */
exports.readCatalog = function (catalogPath) {
    return JSON.decode(exports.getCatalogPath(catalogPath).read({"charset": "UTF-8"}));
};

/**
 * @param catalogPath undefined or a String or Path to a catalog file
 * @param {Object} catalog
 */
exports.writeCatalog = function (catalogPath, catalog) {
    exports.getCatalogPath(catalogPath).write(JSON.encode(catalog, null, 4), {"charset": "UTF-8"});
};

/**
 * Downloads or retrieves from cache the transitive dependencies of a given
 * catalog and returns their parsed contents as an array from the least to most
 * dependent, that ends with the root catalog.
 *
 * @param catalog {Object} the root catalog.
 * @param catalogs {Object} an optional memo of catalog URL's to catalog
 * objects, used to avoid infinite cyclic dependency resolution, defaulting to
 * an empty object.
 * @param order {Array} an optional array of previously processed catalogs in
 * dependency resolution order, from least to most dependent.  It will default
 * to an empty array, have this catalog's transitive dependencies added to the
 * end, and then itself.
 * @param useCache {Boolean} an optional directive to try to use local copies
 * of all remote HTTP resources.  Defaults to false.
 * @param log {Log}
 * @returns the order
 */
exports.getCatalogs = function (catalog, catalogs, order, useCache, log) {
    ASSERT.ok(catalog, "getCatalog called without a starting catalog.");
    // returns a mapping from URL to catalog
    // by attempting to download fresh copies of each 
    // catalog file.  Recurs into the included catalogs
    // of every catalog.
    if (!catalogs)
        catalogs = {};
    if (!order)
        order = [];
    var httpStore = TUSK.getHttpStore();
    (catalog.includes || []).forEach(function (url) {
        url = URI.resolve(catalog.url, url);

        if (UTIL.has(catalogs, url))
            return;
        var include;

        if (!useCache) {
            // try to download a fresh copy
            try {
                log.downloading(url);
                httpStore.download(url);
            } catch (exception) {
                // use an old one if it's no longer available
                log.error("Unable to download a fresh copy of catalog " + url + ".");
            }
        }

        // try to read the downloaded or stale copy
        try {
            var json = httpStore.read(url, {"charset": "UTF-8"});
        } catch (exception) {
            log.error("HttpError getting " + url + ".");
            return;
        }

        // try to parse the source file
        try {
            include = JSON.decode(json);
        } catch (exception) {
            log.error("SyntaxError in " + url + ".");
            return;
        }

        if (include.version < TUSK.minCatalogVersion) {
            log.error("Catalog at " + url + " is obsolete.");
            return;
        }

        catalogs[url] = include;
        include.url = url;
        // validate the catalog
        // transitively grab sub-catalogs
        exports.getCatalogs(include, catalogs, order, useCache, log);
    });
    order.push(catalog);
    return order;
};

/**
 * A Log object, for logging the progress of updating a catalog to a Terminal.
 * @class
 */
var Log = exports.Log = function () {
    stream.print("\0yellow(Updating catalog.\0)");
};

Log.prototype.downloading = function (url) {
    stream.print("\0green(Downloading " + url + "\0)");
};

Log.prototype.writing = function (url) {
    stream.print("\0yellow(Writing " + url + "\0)");
};

Log.prototype.catalog = function (url) {
    stream.print("Catalog: " + url);
    return new this.CatalogLog(url);
};

Log.prototype.error = function (message) {
    stream.error.print("\0red(" + message + "\0)");
};

var CatalogLog = Log.prototype.CatalogLog = function () {
};

CatalogLog.prototype = Object.create(Log.prototype);

CatalogLog.prototype.source = function (name) {
    stream.print("Source: " + name);
};

if (require.main == module) {
    exports.update();
}

