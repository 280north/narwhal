
var util = require('util');
var sandboxing = require('sandbox');
var Loader = sandboxing.Loader;
var Sandbox = sandboxing.Sandbox;

exports.Bundler = function (system) {
    var self = {};

    system = util.copy(system);
    system.platforms = util.copy(system.platforms);
    system.platforms.unshift('browser');
    var paths = util.copy(require.paths);
    paths.unshift(system.prefix + '/platforms/browser/lib');

    var loader = Loader({"paths": paths});
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

    return self;
};

exports.Bundler(system).transitiveDependencies('chiron/base').forEach(print);

