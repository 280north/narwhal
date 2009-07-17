
var util = require('util');
var sandboxing = require('sandbox');
var Loader = sandboxing.Loader;
var AttenuatedLoader = sandboxing.AttenuatedLoader;
var Sandbox = sandboxing.Sandbox;

var contentType = "application/x-javascript";

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

    var timestamps = {};

    self.App = function () {
        // modules?{id} that loads modules from module/{id}
        // module/{id}.js
        // bundle/{id}.js -> including {guids} for postcache, including cache prediction, including loader
        // version/{mtime}/{id}.js -> minified, factorized, cached, mtime verified
        return require("jack/directory").Directory({
            'module': self.moduleApp,
            'bundle': self.bundleApp,
            'factory': self.factoryApp
        });
    };

    self.moduleApp = function (env) {
        var id = env.PATH_INFO.replace(/^\//, '').replace(/\.js$/, '');
        return [
            200,
            {"Content-type": contentType},
            [loader.fetch(id)]
        ];
    };

    self.bundleApp = function (env) {
        var id = env.PATH_INFO.replace(/^\//, '').replace(/\.js$/, '');
        return [
            200,
            {"Content-type": contentType},
            [
                'var factories = {};' +
                self.transitiveDependencies(id).map(function(id) {
                    return 'factories[' + util.enquote(id) + ']=function(require,exports,module,system,print){' +
                        loader.fetch(id) + ';';
                }).join('')
            ]
        ];
    };

    self.factoryApp = function (env) {
        var id = env.PATH_INFO.replace(/^\//, '').replace(/\.js$/, '');
        return [
            200,
            {"Content-type": contentType},
            [
                'factories[' + util.enquote(id) + ']=function(require,exports,module,system,print){' + loader.fetch(id)
            ]
        ];
    };

    return self;
};

if (require.main == module.id) {
    var jack = require("jack");
    var bundler = exports.Bundler(system);
    var app = require('jack/directory').Path(
        {
            "": function (env) {
                return [
                    200,
                    {'Content-type': 'text/html'},
                    '<script' + 
                    ' src="/module/chiron/modules?' +
                        'path=/module/&narwhal/bundle-test">' +
                    '</script>'
                ];
            }
        },
        bundler.App()
    );
    app = jack.ContentLength(app);
    exports.app = app;
    require("jackup").main(["jackup", module.path]);
}

