
var fs = require('file');
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

    self.module = function (id) {
        return loader.fetch(id);
    };

    self.factory = function (id) {
        if (util.has(factories, id))
            return util.get(factories, id);
        var factory = (
            'require.register(' + util.enquote(id) + ',' +
            'function(require,exports,module,system,print){' +
                loader.fetch(id) +
            '/**/\n});'
        );
        util.set(factories, id, factory);
        return factory;
    };

    self.factories = function (id) {
        return self.dependencies(id).map(self.factory).join('');
    };

    self.transitiveFactories = function (id) {
        return self.transitiveDependencies(id).map(self.factory).join('');
    };

    self.bundle = function (id) {
        var bootstrap = fs.path(module.path).resolve('../../platforms/browser/bootstrap.js').read();
        return exports.jsmin(bootstrap).replace(/\s*$/, '') + '.call(this,' + self.factories(id) + ')';
    };

    self.inline = function (id, path) {
        var inline = fs.path(module.path).resolve('../../platforms/browser/inline.js').read().replace(/\s*$/, '');
        var ids = self.transitiveDependencies(id).concat(['sandbox']);
        util.sort(ids, util.by(function (id) {
            return -self.factory(id).length;
        }));
        return inline + '.call(this, ' + 
            JSON.encode(ids) + ',' +
            JSON.encode(id) + ',' +
            JSON.encode(path) +
            ')';
    };

    var timestamps = {};
    var factories = {};

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
            [self.module(id)]
        ];
    };

    self.bundleApp = function (env) {
        var id = env.PATH_INFO.replace(/^\//, '').replace(/\.js$/, '');
        return [
            200,
            {"Content-type": contentType},
            [self.transitiveFactories(id)]
        ];
    };

    self.factoryApp = function (env) {
        var id = env.PATH_INFO.replace(/^\//, '').replace(/\.js$/, '');
        return [200, {"Content-type": contentType}, [self.factory(id)]];
    };

    return self;
};

exports.jsmin = function (text) {
    if (require("jsmin").encode === undefined)
        throw new Error("I should not be.");
    return require("jsmin").encode(text);
};

exports.App = function (app, path) {
    // TODO use path
    var bundler = exports.Bundler(system);
    var jsApp = bundler.App();
    return function (env) {

        if (/^\/js\//.test(env.PATH_INFO)) {
            env.SCRIPT_NAME = env.SCRIPT_NAME + 'js/';
            env.PATH_INFO = env.PATH_INFO.substring(3);
            return jsApp(env);
        }

        var self = {};
        self.inline = function (id) {
            return bundler.inline(id, env.SCRIPT_NAME + 'js/factory/');
        };
        self.xhr = function (id) {
            return env.javascript.path + '/module/modules?path=' + env.javascript.path + '/module/&' + id;
        };
        self.path = env.SCRIPT_NAME + '/js';

        env.javascript = self;
        return app(env);
    };
};

if (require.main == module.id) {
    var app = require('jack/directory').Directory(
        {

            /* this is the inline script solution that uses
             * massively parallel script injection and a heuristic
             * for transitive dependencies */
            "": function (env) {
                return [
                    200,
                    {'Content-type': 'text/html'},
                    [
                        '<html><head><script>' +
                        env.javascript.inline('narwhal/server-test') +
                        '</script></head><body></body></html>'
                    ]
                ];
            },

            /* this uses dynamic, synchronous http requests */
            "xhr": function (env) {
                return [
                    200,
                    {'Content-type': 'text/html'},
                    [
                        '<script src="' +
                        env.javascript.xhr('narwhal/server-test') +
                        '"></script>'
                    ]
                ];
            }

        }
    );
    app = exports.App(app);
    app = require("jack").ContentLength(app);
    exports.app = app;
    require("jackup").main(["jackup", module.path]);
}

