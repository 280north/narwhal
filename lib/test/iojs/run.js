
var base = require('chiron/base');

var Loader = function (root) {
    var loader = {};
    var factories = {};
    loader.resolve = require.loader.resolve;
    loader.evaluate = require.loader.evaluate;
    loader.fetch = function (canonical) {
        return require.loader.fetch(root + canonical);
    };
    loader.load = function (canonical) {
        if (!Object.prototype.hasOwnProperty.call(factories, canonical)) {
            factories[canonical] = loader.evaluate(loader.fetch(canonical), canonical);
        }
        return factories[canonical];
    };
    return loader;
};

var sandbox = function (root, main) {
    require.Sandbox({loader: Loader(root)})(main);
};

base.forEach([
    'absolute',
    'cyclic',
    'exactExports',
    'hasOwnProperty',
    'method',
    'missing',
    'monkeys',
    'nested',
    'relative',
    'transitive'
], function (testName) {
    base.print('BEGIN: ' + testName);
    sandbox('test/iojs/' + testName + '/', 'program');
    base.print('END: ' + testName);
});



