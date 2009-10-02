
// the catalog, inherited from inline.js, is a lookup table of top level module
// identifiers to catalog entries.  catalog entries include a module factory
// function and an array of top level identifiers of each dependency.
var catalog = require.catalog;
// the requests, is an array of the top-level identifiers sent to
// require.request before the mechanisms to fulfill those requests were set up.
// a "request" is like "require" or "require.async" except it just asks that a
// module be required whenever its transitive dependencies are ready to be
// loaded.
var requests = require.requests;
// a lookup table of module top level identifiers to 
//  module exports objects.  these are constructed by calling
//  the module factory with (require, exports, ...).
var modules = {};
// a lookup table of the top level identifier of any module that has ever been
// mentioned, either by having been registered, or having been noted in a
// module's dependency array, to a corresponding promise that will be
// fullfilled when that module and its transitive dependencies have all been
// registered, and thus can be loaded synchronously.
var readys = {};
// a lookup table of the top level identifier of any module that has ever been
// mentioned in the dependency array of another catalog entry to a promise that
// will be fulfilled when that module is registered.  registrations come in
// asynchronously through script injection.
var arrivals = {};
// this will eventually be the ref-send promise module.
var Q;
// this will eventually be the sandbox function, the requirer.
var sandbox;

// gets a promise that will be fulfilled when the module corresponding to the
// given identifier and its transitive dependencies have all been registered,
// which means that it's safe to call require(id).  this function uses the
// readys lookup table as a memo, constructing promises on demand, and
// immediately fullfilling them if conditions warrant.
var getReady = function (id) {
    require.preload([id]); // idempotent
    if (!readys[id])
        readys[id] = Q.defer();
    if (modules[id])
        readys[id].resolve(catalog[id]);
    return readys[id];
};

// gets a promise that will be fulfilled when the module corresponding to the
// given identifier has been registered, which means that any module depending
// on this module may be ready.
var getArrival = function (id) {
    require.preload([id]); // idempotent
    if (!arrivals[id])
        arrivals[id] = Q.defer();
    if (catalog[id])
        arrivals[id].resolve(catalog[id]);
    return arrivals[id];
};

// require.arrive is called by the require.register function defined in
// inline.js whenever a catalog entry arrives through script injection.  the
// require.arrive function starts off as a stub that does nothing, since there
// is nothing it can do until the promise and reactor modules arrive.  we
// replace the original arrival method that notices when these modules are
// ready and initiates the boot process.
require.arrive = function (id) {
    if (catalog.reactor && catalog.promise)
        boot();
};

// check whether reactor and promise have already arrived
require.arrive();

// use the promise and reactor modules to move on to the next phase of the boot
// process, which is the creation of a module loader sandbox with normalized
// globals, primordials, and a system module.  after we have all that set up,
// we can begin watching for the arrival of the requested program module(s).
function boot() {

    // create a stub module loader that can load the promise and reactor
    // modules.  we have to construct them manually and in the proper order in
    // the absense of a full loader.
    var subRequire = function (id) {return modules[id];};
    modules.reactor = {};
    catalog.reactor.factory(subRequire, modules.reactor);
    Q = modules.promise = {};
    catalog.promise.factory(subRequire, modules.promise);

    // a signal that the sandbox has been hooked up and
    // modules may be required.
    var ready = Q.defer();

    // global public API for asynchronously requiring a module, that will be
    // fulfilled with the module's exports whenever it can be loaded, which
    // entails registration of that module's transitive dependencies.
    require.async = function (id) {
        var q = Q.defer();
        Q.when(ready.promise, function () {
            Q.when(getReady(id).promise, function () {
                q.resolve(sandbox(id));
            }, function () {
                q.reject();
            });
        }, function () {
            q.reject();
        });
        return q;
    };

    // global public API: a shortcut for attaching callbacks to a promise to be
    // fulfilled when a requested module is ready to be loaded.
    require.when = function (id, fulfilled, rejected) {
        return Q.when(getReady(id).promise, fulfilled, rejected);
    };

    // we are now ready to make promises about the arrival and readiness of
    // modules.  this is the third replacement of the require.arrive event
    // handler called by require.register whenever it gets executed by an
    // injected script.  this version will create a graph of promises that will
    // collectively determine when each module is ready.
    require.arrive = function (id) {
        var depends = catalog[id].depends;
        var length = depends.length;

        // the module has arrived, but it won't be ready until all of its
        // dependencies are ready.  this promise will be fulfilled when all the
        // dependencies are ready, and in turn will fulfill this module's ready
        // promise.  a module with no dependencies is the basis, so this
        // promise will need to be fulfilled immediately in that case.
        var a = Q.defer();
        Q.when(a.promise, function () {
            getReady(id).resolve(catalog[id]);
        });

        // create a chain of promises that will be ultimately fulfilled when
        // EVERY dependency is ready.
        for (var i = 0; i < length; i++) {
            var depend = depends[i];
            // trap the previous promise and the dependency name in an
            // enclosure.
            a = (function (a, depend) {
                var b = Q.defer();
                // the new promise is that the previous promise has been
                // fulfilled and this dependency is ready.  this is a logical
                // AND promise.
                Q.when(getReady(depend).promise, function () {
                    return Q.when(b.promise, function () {
                        a.resolve(true);
                    });
                })
                return b;
            })(a, depend);
        }

        // if there are no dependencies, this resolves the original promise and
        // in turn marks this module as ready.  if there are dependencies, this
        // half fulfills second operand of the last AND junction among the
        // dependencies, which starts the ball rolling.
        a.resolve(true);

        // oh, by the way, signal the arrival of this module, so some of my
        // dependees can get ready.
        getArrival(id).resolve(catalog[id]);
    };

    // process arrivals that have already occurred.  the catalog already
    // contains several entries for modules that arrived, but they have not
    // been properly processed with the promise system.
    for (var id in catalog) {
        if (Object.prototype.hasOwnProperty.call(catalog, id)) {
            var entry = catalog[id];
            require.arrive(id);
        }
    }

    // now that we can use promises to observe when modules are ready
    // to load, we can move on to the next phase: installing a module
    // loader and kicking off the requested programs.

    // this is another logical AND of promises.  when the "sandbox", "global",
    // and "system" modules with all of their transitive dependencies are ready
    // to be loaded, we proceed.
    Q.when(getReady("sandbox").promise, function () {
    return Q.when(getReady("global").promise, function () {
    return Q.when(getReady("system").promise, function () {

        // the sandbox module needs a semi-functional system object
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

        // the loader is relatively simple since it doesn't need to do
        // any searching or extension resolving.
        var loader = {};
        loader.reload = function (id) {
            if (!catalog[id])
                throw new Error(id + " has not been preloaded.");
            return catalog[id].factory;
        };
        loader.load = function (id) {
            return loader.reload(id);
        };

        // load the sandbox module manually.
        var SANDBOX = {};
        loader.load('sandbox')(
            function () {return system},
            SANDBOX,
            {},
            system,
            system.print
        );
        sandbox = SANDBOX.Sandbox({loader: loader});
        // patch the loader with the sandbox module's general purpose resolve
        // function.
        loader.resolve = SANDBOX.resolve;

        sandbox.async = require.async;

        // apply the system module to the existing system object
        sandbox.force("system");
        // patch the primordials to approach something near ES5 compliance
        sandbox("global");

        // up to this point, the require(id) function defined in inline.js
        // defers to require.require(id), if it is defined.  otherwise it
        // throws an error.  now, we have a sandbox, so we can return modules.
        require.require = sandbox;

        // notify any requested module programs that they may
        // require modules.
        ready.resolve(true);

        // we now have all of the plumbing to request, register, load, and
        // require modules.  we have a backlog of module's to request (these
        // were deferred by the require.request function defined in inline.js).
        // with our new require.request method, complete those requests.
        var length = requests.length;
        for (var i = 0; i < length; i++) {
            var id = requests[i];
            require.async(id);
        }

    // because lisp wasn't bad enough
    });});});

}

