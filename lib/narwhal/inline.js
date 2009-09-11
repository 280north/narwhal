(function (path) {

    var catalog = {}; // id -> {factory, depends}
    var blockages = {}; // id -> [dependee]
    var observers = {}; // id -> [observer]

    var keys = function (object) {
        var keys = [];
        for (var name in object)
            keys.push('"' + name + '"');
        return keys;
    };

    var require = this.require = function temp(id, baseId) {
        if (require === temp)
            throw new Error("Cannot require " + id + " until sandbox has loaded.");
        // defer to later overriden require call
        require(id, baseId);
    };

    // waiting -> arrived -> pending -> ready

    // when a module arrives
    //    for each dependency
    //        if the dependency has not already arrived
    //            add an observer for the readiness of the dependnecy
    //    check readiness of this module
    // when a module becomes ready
    //    for each of the module's pending its readiness,
    //        remove this module from the pending queue
    //        check the readiness of that module
    // when checking readiness
    //    if there are no dependencies pending
    //        advance to ready

    require.register = function (entries) {
        for (var id in entries) {
            if (Object.prototype.hasOwnProperty.call(entries, id)) {
                //console.log('arrived ' + id);

                var entry = entries[id];
                catalog[id] = entry;
                entry.ready = false;
                entry.pending = [];
                var depends = entry.depends;
                var length = depends.length;
                for (var i = 0; i < length; i++) {
                    var depend = depends[i];
                    if (!catalog[depend] || !catalog[depend].ready) {
                        entry.pending.push(depend);
                        if (!blockages[depend])
                            blockages[depend] = [];
                        blockages[depend].push(id);
                    }
                }
                check(id);
            }
        }
    };

    var reify = function (id) {
        //console.log('ready ' + id);
        var entry = catalog[id];
        entry.ready = true;

        var blockage = blockages[id] || [];
        var length = blockage.length;
        for (var i = 0; i < length; i++) {
            var blocker = blockage[i];
            var blocked = catalog[blocker];
            var position = blocked.pending.indexOf(id);
            if (position >= 0)
                blocked.pending.splice(position, 1);
            check(blocker);
        }

        if (catalog.sandbox && catalog.sandbox.ready) {
            // send signals
            var entryObservers = observers[id] || [];
            var length = entryObservers.length;
            for (var i = 0; i < length; i++) {
                var entryObserver = entryObservers[i];
                entryObserver();
            }
        } else {
            if (!observers.sandbox)
                observers.sandbox = [];
            observers.sandbox.push.apply(
                observers.sandbox,
                observers[id]
            );
        }

    };

    var check = function (id) {
        var entry = catalog[id];
        if (!entry)
            return false;
        if (!entry.pending.length) {
            reify(id);
        } else {
            //console.log(id + " still pending " + entry.pending);
        }
    };

    // bypasses promising for the time being
    require.when = function (id, block) {
        //console.log('when ' + id);
        if (!observers[id])
            observers[id] = [];
        observers[id].push(block);
        check(id);
        return require;
    };

    require.main = function (id) {
        //console.log('main ' + id);
        require.when(id, function () {
            require(id);
        });
    };

    // or async..., whatever
    require.async = function (id) {
        var pair = require("Q").ref();
        var promise = pair[0];
        var resolve = pair[1];
        require.when(id, resolve);
        return promise;
    };

    require.preload = function (ids) {
        //console.log('preload ' + ids);
        //var head = document.getElementsByTagName('head')[0];
        var length = ids.length;
        for (var i = 0; i < length; i++) {
            var script = document.createElement('script');
            script.src = path + ids[i] + '.js';
            //head.appendChild(script);
            document.documentElement.insertBefore(
                script,
                document.documentElement.firstChild
            );
            // prepend instead of append to avoid KB917927
            // - Kean Tan <http://www.karmagination.com/>
        };
        return require;
    };

    require.when("sandbox", function () {
        //console.log("sandbox...");
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
            //console.log(id);
            if (!catalog[id])
                throw new Error(id + " has not been preloaded.");
            return catalog[id].factory;
        };
        loader.load = function (id) {
            return loader.reload(id);
        };

        var sandbox = {};
        loader.load('sandbox')(
            function () {return system},
            sandbox,
            {},
            system,
            system.print
        );
        require = sandbox.Sandbox({loader: loader});
        loader.resolve = sandbox.resolve;

    });

    return require;
})
