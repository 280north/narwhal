
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- cadorn Christoph Dorn

// NOTE: this file is used is the bootstrapping process,
// so any "requires" must be accounted for in narwhal.js

var system = require("system");
// HACK: the stars prevent the file module from being sent to browser
//  clients with the regexen we're using.  we need a real solution
//  for this.
var file = require(/**/"file"/**/);

// this gets swapped out with a full fledged-read before
//  we're done using it
var read = file.read;
var Module = system.Module || system.evaluate; // legacy

exports.Loader = function (options) {
    var loader = {};
    var factories = options.factories || {};
    var paths = options.paths;
    var extensions = options.extensions || ["", ".js"];
    var timestamps = {};
    var debug = options.debug;

    loader.resolve = exports.resolve;

    loader.resolvePkg = function(id, baseId, pkg, basePkg) {
        return exports.resolvePkg(loader, id, baseId, pkg, basePkg);
    };

    loader.find = function (topId) {
        // if it's absolute only search the "root" directory.
        // file.join() must collapse multiple "/" into a single "/"
        var searchPaths = file.isAbsolute(topId) ? [""] : paths;

        for (var j = 0; j < extensions.length; j++) {
            var extension = extensions[j];
            for (var i = 0; i < searchPaths.length; i++) {
                var path = file.join(searchPaths[i], topId + extension);
                if (file.isFile(path))
                    return path;
            }
        }
        throw new Error("require error: couldn't find \"" + topId + '"');
    };

    loader.fetch = function (topId, path) {
        if (!path)
            path = loader.find(topId);
        if (typeof file.mtime === "function")
            timestamps[path] = file.mtime(path);
        if (debug)
            print('loader: fetching ' + topId);
        var text = read(path, {
            'charset': 'utf-8'
        });
        // we leave the endline so the error line numbers align
        text = text.replace(/^#[^\n]+\n/, "\n");
        return text;
    };

    loader.Module = function (text, topId, path) {
        if (system.evaluate) {
            if (!path)
                path = loader.find(topId);
            var factory = Module(text, path, 1);
            factory.path = path;
            return factory;
        } else {
            return function (inject) {
                var keys = [], values = [];
                for (var key in inject) {
                    if (Object.prototype.hasOwnProperty.call(inject, key)) {
                        keys.push(key);
                        values.push(inject[key]);
                    }
                }
                return Function.apply(null, keys).apply(this, values);
            };
        }
    };

    loader.load = function (topId, path) {
        if (!Object.prototype.hasOwnProperty.call(factories, topId)) {
            loader.reload(topId, path);
        } else if (typeof file.mtime === "function") {
            var path = loader.find(topId);
            if (loader.hasChanged(topId, path))
                loader.reload(topId, path);
        }
        return factories[topId];
    };

    loader.reload = function (topId, path) {
        factories[topId] = loader.Module(loader.fetch(topId, path), topId, path);
    };

    loader.isLoaded = function (topId) {
        return Object.prototype.hasOwnProperty.call(factories, topId);
    };

    loader.hasChanged = function (topId, path) {
        if (!path)
            path = loader.resolve(topId);
        return (
            !Object.prototype.hasOwnProperty.call(timestamps, path) ||
            file.mtime(path) > timestamps[path]
        );
    };

    loader.paths = paths;
    loader.extensions = extensions;

    return loader;
};

exports.resolve = function (id, baseId) {
    id = String(id);
    if (id.charAt(0) == ".") {
        id = file.dirname(baseId) + "/" + id;
    }
    // module ids need to use forward slashes, despite what the OS might say
    return file.normal(id).replace(/\\/g, '/');
};

exports.resolvePkg = function(loader, id, baseId, pkg, basePkg) {
    if(!loader.usingCatalog) {
        // no usingCatalog - fall back to default
        return [exports.resolve(id, baseId), null];
    }
    if(pkg) {
        // locate id in pkg
        if(basePkg && loader.usingCatalog[basePkg]) {
            // see if pkg is an alias                
            var packages = loader.usingCatalog[basePkg].packages;
            if(packages[pkg]) {
                if(loader.usingCatalog[packages[pkg]]) {
                    var path = loader.usingCatalog[packages[pkg]].libPath;
                    return [exports.resolve("./" + id, path + "/"), packages[pkg]];
                } else {
                    throw "Package '"+packages[pkg]+"' aliased with '"+pkg+"' in '"+basePkg+"' not found";
                }
            }
        }
        // see if pkg is a top-level ID             
        if(loader.usingCatalog[pkg]) {
            var path = loader.usingCatalog[pkg].libPath;
            return [exports.resolve("./" + id, path + "/"), pkg];
        } else {
            throw "Package '" + pkg + "' not aliased in '"+basePkg+"' nor a top-level ID";
        }
    } else {
        // if id is relative we want a module relative to basePkg if it exists
        if(id.charAt(0) == "." && basePkg) {
            // if baseId is absolute we use it as a base and ignore basePkg
            if(file.isAbsolute(baseId)) {
                path = file.Path(baseId);
            } else
            if(loader.usingCatalog[basePkg]) {
                path = loader.usingCatalog[basePkg].libPath.join(baseId);
            } else {
                throw "basePkg '" + basePkg + "' not known";
            }
            
            // try and locate the path - at this stage it should be found
            return [exports.resolve(id, path.valueOf()), basePkg];
            
        } else {
            // id is not relative - resolve against system modules
            return [exports.resolve(id, baseId), undefined];
        }
    }
};
