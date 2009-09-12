
var catalog = require.catalog;
var requests = require.requests;
var modules = {};
var readys = {};
var arrivals = {};
var sandbox;
var Q; // promise module

require.arrive = function (id) {
    if (catalog.reactor && catalog.promise)
        boot();
};

var getReady = function (id) {
    if (!readys[id])
        readys[id] = Q.defer();
    if (modules[id])
        readys[id].resolve(catalog[id]);
    return readys[id];
};

var getArrival = function (id) {
    if (!arrivals[id])
        arrivals[id] = Q.defer();
    if (catalog[id])
        arrivals[id].resolve(catalog[id]);
    return arrivals[id];
};

function boot() {

    var subRequire = function (id) {return modules[id];};
    modules.reactor = {};
    catalog.reactor.factory(subRequire, modules.reactor);
    Q = modules.promise = {};
    catalog.promise.factory(subRequire, modules.promise);

    require.when = function (id, block) {
        return Q.when(getReady(id).promise, block);
    };

    require.async = function (id) {
        return getReady(id);
    };

    require.request = function (id) {
        return Q.when(getReady(id).promise, function () {
            sandbox(id);
        });
    };

    require.arrive = function (id) {
        var depends = catalog[id].depends;
        var length = depends.length;
        var a = Q.defer();
        Q.when(a.promise, function () {
            getReady(id).resolve(catalog[id]);
        });
        for (var i = 0; i < length; i++) {
            var depend = depends[i];
            a = (function (a, depend) {
                var b = Q.defer();
                Q.when(getReady(depend).promise, function () {
                    return Q.when(b.promise, function () {
                        a.resolve(true);
                    });
                })
                return b;
            })(a, depend);
        }
        a.resolve(true);
        getArrival(id).resolve(catalog[id]);
    };

    // process arrivals that have already occurred
    for (var id in catalog) {
        if (Object.prototype.hasOwnProperty.call(catalog, id)) {
            var entry = catalog[id];
            require.arrive(id);
        }
    }

    Q.when(getReady("sandbox").promise, function () {
    return Q.when(getReady("global").promise, function () {
    return Q.when(getReady("system").promise, function () {

        console.log("sandbox is ready");

        var system = {};
        system.print = function () {
            if (typeof console != "undefined") {
                console.log(Array.prototype.join.call(arguments, ' '));
            }
        };
        system.fs = {
            normal: function (path) {
                return path;
            }
        };
        system.engine = "browser";
        system.engines = ["browser"];

        var loader = {};
        loader.reload = function (id) {
            if (!catalog[id])
                throw new Error(id + " has not been preloaded.");
            return catalog[id].factory;
        };
        loader.load = function (id) {
            return loader.reload(id);
        };

        var SANDBOX = {};
        loader.load('sandbox')(
            function () {return system},
            SANDBOX,
            {},
            system,
            system.print
        );
        sandbox = SANDBOX.Sandbox({loader: loader});
        loader.resolve = SANDBOX.resolve;

        sandbox.force("system");
        sandbox("global");

        // invoke deferred requests
        var length = requests.length;
        for (var i = 0; i < length; i++) {
            var id = requests[i];
            require.request(id);
        }

    });});});

}

