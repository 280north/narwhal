
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson
// -- cadorn Christoph Dorn

// NOTE: this file is used is the bootstrapping process,
// so any "requires" must be accounted for in narwhal.js

var FILE = require("file");
var LOADER = require("loader");

exports.MultiLoader = function (options) {

    var factories = options.factories || {};

    var self = {};
    self.paths = options.paths || [];
    self.loader = options.loader || LOADER.Loader(options);
    self.loaders = options.loaders || [
        ["", self.loader],
        [".js", self.loader]
    ];

    self.resolve = LOADER.resolve;

    self.resolvePkg = function(id, baseId, pkg, basePkg) {
        return LOADER.resolvePkg(self, id, baseId, pkg, basePkg);
    };

    self.find = function (topId) {
        // if it's absolute only search the "root" directory.
        // FILE.join() must collapse multiple "/" into a single "/"
        var searchPaths = FILE.isAbsolute(topId) ? [""] :  self.paths;
        
        for (var j = 0, jj = self.loaders.length; j < jj; j++) {
            var extension = self.loaders[j][0];
            var loader = self.loaders[j][1];
            for (var i = 0, ii = searchPaths.length; i < ii; i++) {
                var path = FILE.join(searchPaths[i], topId + extension);
                if (FILE.isFile(path)) {
                    // now check each extension for a match.
                    // handles case when extension is in the id, so it's matched by "",
                    // but we want to use the loader corresponding to the actual extension
                    for (var k = 0, kk = self.loaders.length; k < kk; k++) {
                        var ext = self.loaders[k][0];
                        if (path.lastIndexOf(ext) === path.length - ext.length)
                            return [self.loaders[k][1], path];
                    }
                    throw new Error("shouldn't reach this point!");
                }
            }
        }
        throw new Error("require error: couldn't find \"" + topId + '"');
    };

    self.load = function (topId, loader, path) {
        if (!loader || !path) {
            var pair = self.find(topId);
            loader = pair[0];
            path = pair[1];
        }
        if (
            !Object.prototype.hasOwnProperty.call(factories, topId) ||
            (loader.hasChanged && loader.hasChanged(topId, path))
        )
            self.reload(topId, loader, path);
        return factories[topId];
    };

    self.reload = function (topId, loader, path) {
        if (!loader || !path) {
            var pair = self.find(topId);
            loader = pair[0];
            path = pair[1];
        }
        loader.reload(topId, path);
        factories[topId] = loader.load(topId, path);
    };

    self.isLoaded = function (topId) {
        return Object.prototype.hasOwnProperty.call(factories, topId);
    };

    return self;
};

