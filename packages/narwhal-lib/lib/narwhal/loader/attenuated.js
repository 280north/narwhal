
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

exports.AttenuatedLoader = function (loader) {
    var self = {};

    self.resolve = Object.freeze(function (id, baseId) {
        return loader.resolve(id, baseId);
    });

    self.fetch = Object.freeze(function (topId) {
        if (/\./.test(topId))
            throw new Error("Invalid module identifier: " + topId);
        return loader.fetch(topId);
    });

    self.load = Object.freeze(function (topId, path) {
        if (/\./.test(topId))
            throw new Error("Invalid module identifier");
        return loader.load(topId, path);
    });

    self.reload = Object.freeze(function (topId) {
        if (/\./.test(topId))
            throw new Error("Invalid module identifier");
        return loader.reload(topId, path);
    });

    return Object.freeze(self);
};

