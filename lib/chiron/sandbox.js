
var base = require('./base');
var optioned = require('./optioned');

/*** BaseLoader
*/
exports.BaseLoader = base.type([optioned.Optioned], function (self, supr) {
    var factories = base.dict();

    self.option('factories', function (_factories) {
        factories = base.dict(_factories);
    });

    self.resolve = function () {
        throw new Error("resolve is not implemented on " + self.repr());
    };

    self.fetch = function () {
        throw new Error("fetch is not implemented on " + self.repr());
    };

    self.evaluate = function (text, id) {
        return require.evaluate(text, id);
    };

    self.load = function (id) {
        if (!factories.has(id)) {
            factories.set(id, self.fetch(id));
        }
        return factories.get(id);
    };

});

/*** PrefixLoader
*/
exports.PrefixLoader = base.type([optioned.Optioned], function (self, supr) {
    var prefix, loader;
    self.init = function (_prefix, _loader, options) {
        supr.init(options);
        loader = _loader;
        prefix = _prefix;
    };
    self.resolve = function (id, baseId) {
        return loader.resolve(id, baseId);
    };
    self.evaluate = function (text, canonicalId) {
        return loader.evaluate(text, prefix + canonicalId);
    };
    self.fetch = function (canonicalId) {
        return loader.fetch(prefix + canonicalId);
    };
    self.load = function (canonicalId) {
        return loader.load(prefix + canonicalId);
    };
});

/*** Sandbox
*/
exports.Sandbox = base.type(function (self, supr) {
    var loader,
        modules,
        sandboxEnvironment,
        debug,
        main,
        debugDepth = 0;

    self.init = function (options) {
        supr.init(options);
        options = base.dict(options);
        loader = options.get('loader');
        modules = base.dict(options.get('modules', undefined));
        sandboxEnvironment = base.object(options.get('environment', undefined));
        debug = options.get('debug', false);
    };

    self.invoke = function (id, baseId) {
        if (base.no(baseId))
            main = id;

        id = loader.resolve(id, baseId);

        if (!modules.has(id)) {

            if (debug) {
                debugDepth++;
                environment.print(base.mul('+', debugDepth) + ' ' + id, 'module');
            }

            try {
                var exports = {};
                modules.set(id, exports);
                var factory = loader.load(id);
                var require = Require(id);
                factory(require, exports, sandboxEnvironment);
            } catch (exception) {
                modules.del(id);
                throw exception;
            }

            if (debug) {
                environment.print(base.mul('-', debugDepth) + ' ' + id, 'module');
                debugDepth--;
            }

        }
        return modules.get(id);
    };

    var Require = function (baseId) {
        var require = function (id) {
            try {
                return self(id, baseId);
            } catch (exception) {
                if (exception.message)
                    exception.message += ' in ' + baseId;
                throw exception;
            }
        };
        require.id = baseId;
        require.loader = loader;
        require.main = main;
        return require;
    };

});

/*** sandbox
*/
exports.sandbox = function (main, environment, options) {
    if (!environment)
        environment = {};
    options = base.dict(options);
    var prefix = options.get('prefix', undefined);
    var loader = options.get('loader', require.loader);
    var debug = options.get('debug', false);
    if (!loader) throw new Error(
        "sandbox cannot operate without a loader, either explicitly " + 
        "provided as an option, or implicitly provided by the current " +
        "sandbox's 'loader' object."
    );
    if (prefix)
        loader = exports.PrefixLoader(prefix, loader);
    var sandbox = exports.Sandbox({
        loader: loader,
        environment: environment,
        debug: debug
    });
    return sandbox(main);
};

