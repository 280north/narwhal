(function (ids, id, path) {

    var factories = {};
    var pending;

    var require = this.require = function (id, baseId) {
        // defer to require set later from the sandbox module
        require(id, baseId);
    };

    require.register = function (id, factory) {
        factories[id] = factory;
        if (!--pending)
            main();
    };

    var pending = ids.length;
    var head = document.getElementsByTagName('head')[0];
    for (var i = 0; i < pending; i++) {
        var script = document.createElement('script');
        script.src = path + ids[i] + '.js';
        head.appendChild(script);
    };

    function main() {

        var system = {};
        system.print = function () {
            if (typeof console != "undefined") {
                console.log(Array.prototype.join.call(arguments, ' '));
            }
        };

        var loader = {};
        loader.reload = function (topId) {
            return factories[topId];
        };
        loader.load = function (topId) {
            return loader.reload(topId);
        };

        var sandbox = {};
        loader.load('sandbox')(
            null,
            sandbox,
            {},
            system,
            system.print
        );
        require = sandbox.Sandbox({loader: loader});
        loader.resolve = sandbox.resolve;
        require(id);

    }

})
