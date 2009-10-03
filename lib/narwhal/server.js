
var SYSTEM = require("system");
var FILE = require("file");
var UTIL = require("util");
var SANDBOX = require("sandbox");
var JSMIN = require("jsmin");
var JACKUTILS = require("jack/utils");

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
        // special case for the sandbox observer
        //  in inline.js
        if (baseId == "sandbox")
            return ["global", "system"];
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

    self.bundle = function (ids) {
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
        var content = bundler.bundle([id]);
        if (!debug)
            content = JSMIN.encode(content);
        return {
            "status": 200,
            "headers": {"Content-type": contentType},
            "body": [content]
        };
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
    var jsApp = exports.BundlerApp(bundler, options);

    return function (env) {
        if (!proxy)
            proxy = '/' + env.SCRIPT_NAME + path;
        env.script = exports.ClientLoader(
            env,
            proxy,
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

    var bootstrap = [
        "narwhal/client",
        "sandbox",
        "system",
        "ref-send",
        "reactor"
    ].concat(
        bundler.deepDepends("global")
    );
    var queue = Array.prototype.slice.call(bootstrap);

    var clientSent = false;
    var client = function () {
        if (clientSent) {
            return "require";
        } else {
            clientSent = true;
            var content = inline +
                ".call(this," + UTIL.repr(path) + ")";
            if (!debug)
                content = JSMIN.encode(content);
            return content;
        }
    };

    var flush = function () {
        var ids = queue.splice(0, queue.length);
        UTIL.sort(ids, UTIL.by(function (id) {
            return -bundler.module(id).length;
        }));
        return client() +
            ".preload(" + UTIL.repr(ids) + ")";
    };

    loader.loader = function () {
        return flush();
    };

    // returns a script that loads a bunch of factories
    loader.preload = function (ids) {
        ids = Array.prototype.concat.apply([], ids.map(bundler.deepDepends));
        // enqueue the given module's deep dependencies
        queue.push.apply(queue, ids);
        return flush();
    };

    // returns a script that loads and requires a module
    loader.require = function (id) {
        return loader.preload([id]) + ".async(" + UTIL.repr(id) + ")";
    };
    
    // return a script that *is* a bunch of factories and a loader for them.
    loader.embed = function (id) {
        var content = loader.loader() +
            ".bridge(function(require){" + 
                bundler.bundle(
                    queue.splice(0, queue.length)
                    .concat(bundler.deepDepends(id))
                ) +
            "}).async(" + UTIL.repr(id) + ");";
        if (!debug)
            content = JSMIN.encode(content);
        return content;
    };

    return loader;
};

exports.main = function () {
    var app = function (env) {
        if (/^../.test(env.PATH_INFO))
            return JACKUTILS.responseForStatus(404, env.PATH_INFO);
        return {
            "status": 200,
            "headers": {"Content-type": "text/html"},
            "body": [
                "<html><head><script>" +
                env.script.require("narwhal/server-test") +
                "</script></head><body></body></html>"
            ]
        };
    };
    app = exports.App(app, {"debug": true});
    app = require("jack").ContentLength(app);
    exports.app = app;
    require("jackup").main(["jackup", module.path]);
};

if (require.main == module.id)
    exports.main();

