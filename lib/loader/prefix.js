
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

exports.PrefixLoader = function (prefix, loader) {
    var self = this || {};

    self.resolve = function (id, baseId) {
        return loader.resolve(id, baseId);
    };

    /**** evaluate
    */
    self.evaluate = function (text, topId) {
        return loader.evaluate(text, prefix + topId);
    };

    /**** fetch
    */
    self.fetch = function (topId) {
        return loader.fetch(prefix + topId);
    };

    /**** load
    */
    self.load = function (topId) {
        return loader.load(prefix + topId);
    };

    return self;
};

