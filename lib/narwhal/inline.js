(function (path) {

    var require = this.require = function (id) {
        throw new Error("require is not yet available");
    };

    require.catalog = {};
    require.requests = [];

    // stub
    require.arrive = function () {};

    require.register = function (entries) {
        for (var id in entries) {
            if (Object.prototype.hasOwnProperty.call(entries, id)) {
                require.catalog[id] = entries[id];
                require.arrive(id);
                if (id == "narwhal/client")
                    entries[id].factory(require);
            }
        }
    };

    require.preload = function (ids) {
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

    require.request = function (id) {
        require.requests.push(id);
        return require;
    };

    return require;
})
