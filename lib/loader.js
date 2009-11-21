
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

exports.Loader = function (options) {
    var loader = {};
    var factories = options.factories || {};
    var paths = options.paths;
    var extensions = options.extensions || ["", ".js"];
    var timestamps = {};
    var debug = options.debug;

    loader.resolve = exports.resolve;

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

    loader.evaluate = function (text, topId, path) {
        if (system.evaluate) {
            if (!path)
                path = loader.find(topId);
            var factory = system.evaluate(text, path, 1);
            factory.path = path;
            return factory;
        } else {
            return new Function("with(arguments[0]){"+text+"\n//*/}");
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
        factories[topId] = loader.evaluate(loader.fetch(topId, path), topId, path);
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
    if (typeof id != "string")
        throw new Error("module id '" + id + "' is not a String");
    if (id.charAt(0) == ".") {
        id = file.dirname(baseId) + "/" + id;
    }
    return file.normal(id);
};

