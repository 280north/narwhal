
var util = require('util');
var sandboxing = require('sandbox');
var Loader = sandboxing.Loader;
var AttenuatedLoader = sandboxing.AttenuatedLoader;
var Sandbox = sandboxing.Sandbox;

exports.Bundler = function (system) {
    var self = {};

    system = util.copy(system);
    system.platforms = util.copy(system.platforms);
    system.platforms.unshift('browser');
    var paths = util.copy(require.paths);
    paths.unshift(system.prefix + '/platforms/browser/lib');

    var loader = AttenuatedLoader(Loader({"paths": paths}));
    var sandbox = Sandbox({'loader': loader, 'system': system});

    sandbox.force('system');
    sandbox('global');
    sandbox('packages').main();

    self.dependencies = function (baseId) {
        var dependencies = [];
        loader.fetch(baseId).replace(
            /require\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
            function (all, quote, id) {
                dependencies.push(loader.resolve(id, baseId));
                return all;
            }
        );
        return dependencies;
    };

    self.transitiveDependencies = function (id, visited) {
        var result = [];
        if (!visited)
            visited = {};
        if (util.has(visited, id))
            return result;
        visited[id] = true;
        result.push(id);
        self.dependencies(id).forEach(function (id) {
            result.push.apply(
                result,
                self.transitiveDependencies(id, visited)
            );
        });
        return result;
    };

    self.App = function () {
        return function (env) {
            try {
                var content = loader.fetch(
                    env.PATH_INFO.replace(/^\//, '')
                );
                return [
                    200,
                    {
                        "Content-type": "text/plain",
                        "Content-length": '' + content.length
                    },
                    [content]
                ];
            } catch (exception) {
                return [
                    500,
                    {
                        "Content-type": "text/plain",
                        "Content-length": "0"
                    },
                    [""]
                ];
            }
        }
    };

    return self;
};

if (require.main == module.id) {
    var bundler = exports.Bundler(system);
    exports.app = bundler.App();
    require("jackup").main(["jackup", module.path]);
}

