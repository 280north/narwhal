
var SYSTEM = require("system");
var FILE = require("file");
var UTIL = require("util");
var SANDBOX = require("sandbox");
var JSMIN = require("jsmin");

var Loader = SANDBOX.Loader;
var AttenuatedLoader = SANDBOX.AttenuatedLoader;
var Sandbox = SANDBOX.Sandbox;

var contentType = "application/x-javascript";

exports.Bundler = function (system) {
    var self = {};

    if (!system)
        system = SYSTEM;
    system = Object.create(system);
    system.engine = "browser";
    system.engines = UTIL.copy(system.engines);
    system.engines.unshift("browser");
    var paths = require.paths.map(function (path) {
        return String(path);
    });
    paths.unshift(FILE.join(system.prefix, "engines", "browser", "lib"));

    var loader = AttenuatedLoader(Loader({"paths": paths}));
    var sandbox = Sandbox({
        "loader": loader,
        "system": system,
        "modules": {
            "system": system
        }
    });

    sandbox.force("system");
    sandbox("global");
    sandbox("packages").main();

    self.depends = function (baseId) {
        var depends = [];
        loader.fetch(baseId).replace(
            // TODO proper recursive descent parser
            /require\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
            function (all, quote, id) {
                depends.push(loader.resolve(id, baseId));
                return all;
            }
        );
        return depends;
    };

    self.deepDepends = function (id, visited) {
        var result = [];
        if (!visited)
            visited = {};
        if (UTIL.has(visited, id))
            return result;
        visited[id] = true;
        result.push(id);
        self.depends(id).forEach(function (id) {
            result.push.apply(
                result,
                self.deepDepends(id, visited)
            );
        });
        return result;
    };

    self.module = function (id) {
        return loader.fetch(id);
    };

    self.bundle = function () {
        var ids = Array.prototype.concat.apply([], arguments);
        return (
            "require.register({" +
            ids.map(function (id) {
                var depends = JSON.encode(self.depends(id));
                var factory = (
                    "function(require,exports,module,system,print){" +
                        loader.fetch(id) +
                    "/**/\n}" 
                );
                return (
                    UTIL.enquote(id) + ':' +
                    "{" +
                        '"factory":' + factory + "," +
                        '"depends":' + depends +
                    "}"
                );
            }).join(",") + 
            "});"
        );
    };

    return self;
};

exports.BundlerApp = function (bundler, options) {
    options = options || {};
    var debug = options.debug;
    return function (env) {
        var id = env.PATH_INFO.replace(/^\//, '').replace(/\.js$/, '');
        var content = bundler.bundle(id);
        if (debug)
            content = JSMIN.encode(content);
        return [200, {"Content-type": contentType}, [content]];
    };
};

exports.App = function (nextApp, options) {
    options = options || {};
    var debug = options.debug;
    var proxy = options.proxy;
    var catalog = options.catalog;
    var noHost = proxy || catalog;
    if (noHost && options.path)
        throw new Error("The path option is not applicable when using a proxy or catalog.");

    var bundler = exports.Bundler();

    var path = options.path || '.js/';
    if (!/\/$/.test(path))
        path += "/";
    var re = new RegExp("^/" + RegExp.escape(path));
    var jsApp = exports.BundlerApp(bundler);

    return function (env) {
        env.script = exports.ClientLoader(
            env,
            '/' + env.SCRIPT_NAME + path,
            bundler,
            options
        );
        if (noHost) {
            return nextApp(env);
        } else if (re.test(env.PATH_INFO)) {
            env = Object.create(env);
            env.SCRIPT_NAME = env.SCRIPT_NAME + path;
            env.PATH_INFO = env.PATH_INFO.substring(path.length);
            return jsApp(env);
        } else {
            return nextApp(env);
        }
    };

};

var inline = FILE.path(module.path)
    .resolve("inline.js")
    .read()
    .replace(/\s*$/, "");

exports.ClientLoader = function (env, path, bundler, options) {
    options = options || {};
    var debug = options.debug;
    var bundle = options.bundle;
    var proxy = options.proxy;
    var catalog = options.catalog;

    // returns a script that loads a program
    var loader = {};

    var loaderSent = false;
    var clientRequire = function () {
        if (loaderSent) {
            return "require";
        } else {
            loaderSent = true;
            return inline + ".call(this," + UTIL.repr(path) + ")";
        }
    };

    // returns a script that loads a bunch of factories
    loader.preload = function (id) {
        var ids = bundler.deepDepends(id).concat([
            "system",
            "sandbox",
        ]);
        UTIL.sort(ids, UTIL.by(function (id) {
            return -bundler.module(id).length;
        }));
        return clientRequire() + ".preload(" + UTIL.repr(ids) + ")";
    };

    // returns a script that loads and requires a module
    loader.require = function (id) {
        return loader.preload(id) + ".main(" + UTIL.repr(id) + ")";
    };
    
    // return a script that is a bunch of factories
    loader.embed = function () {
    };

    return loader;
};

exports.main = function () {
    var app = function (env) {
        return [
            200,
            {"Content-type": "text/html"},
            [
                "<html><head><script>" +
                env.script.require("narwhal/server-test") +
                "</script></head><body></body></html>"
            ]
        ];
    };
    app = exports.App(app);
    app = require("jack").ContentLength(app);
    exports.app = app;
    require("jackup").main(["jackup", module.path]);
};

if (require.main == module.id)
    exports.main();

