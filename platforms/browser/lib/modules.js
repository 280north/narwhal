/*preamble-kriskowal
    Copyright (c) 2002-2009 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
*/

/*
    isolate the module loader in an enclosure by creating an
    annonymous function and then--at the end of this file--
    calling it.

    also, take the evalGlobal function as an argument so that it can be
    declared in global scope.  this prevents the eval function
    from inheriting variables from the modulesjs enclosure scope.
*/
(function (evalGlobal) {

    /*
        kernel module factory functions.  this module bootstrapper script
        can also be used as a module, since it contains module
        factory functions that can be used to bootstrap platform-specific
        modules.  to that end, we export the module factory functions if
        there is an ambient "exports" object
    */
    var factories = typeof exports == "undefined" ? {} : exports;
    /* kernel module instances */
    var modules = {};

    /*
        a rudimentary require function to jumpstart
        the module system
    */
    var require = function (id) {
        if (!Object.prototype.hasOwnProperty.call(modules, id)) {
            var exports = {};
            modules[id] = exports;
            factories[id](require, exports, system);
        }
        return modules[id];
    };

    /* a permissive system for kernel modules */
    var system = {
        window: window,
        evalGlobal: evalGlobal
    };

    factories.main = function (require, exports, system) {

        var FILE = 'modules'; /* used to find the corresponding <script> */

        var urls = require('urls');
        var browser = require('browser');
        var console = require('console');

        var window = system.window;
        var document = window.document;
        system.print = console.print;
        system.messages = console.messages;

        /* grab the URL of modules.js relative to the containing page,
           and remove the <script> tag that invoked this module loader
           from the DOM for maximum stealth.
        */
        var PATH = urls.resolve(function () { /* enclosure */
            var scripts = document.getElementsByTagName("script");
            for (var i = 0; i < scripts.length; i++) {
                var script = scripts[i];
                if (browser.hasAttr(script, "src")) {
                    var src = script.getAttribute("src");
                    src = urls.parse(src);
                    if (src.file == FILE) {
                        script.parentNode.removeChild(script);
                        return urls.resolve(src, window.location.href);
                    }
                }
            }
            throw new Error("could not find '" + FILE + "' <script>");
        }());

        /* wait for the DOM to be fully loaded */
        browser.observeDomReady(function () {

            var sandbox = require('sandbox');
            sandbox.execUrl(PATH, PATH, system);

            /* note for CSS that JavaScript is enabled, and ready */
            document.body.className = document.body.className + ' javascript';

        });

    };

    factories.sandbox = function (require, exports, system) {

        var http = require('http');
        var urls = require('urls');
        var evalGlobal = system.evalGlobal;

        exports.Loader = function (options) {
            options = options || {};
            var factories = options.factories || {};
            var path = options.path;
            var exportsLocal = options.exportsLocal;
            var importsLocal = options.importsLocal;

            var loader = {};

            loader.fetch = function (id) {
                var url = urls.resolve(id, path) + '.js';
                return http.requestContent(url);
            };

            loader.evaluate = function (text, id) {
                var iojs = /"use iojs";/.test(text);
                /* optionally bring imports into scope with include */
                if (importsLocal && !iojs)
                    text = "with (imports||{}) {" + text + "}";
                /* optional bring exports into scope when assigned to exports */
                if (exportsLocal && !iojs)
                    text = "with (exports) {" + text + "}";
                /* safeguard "var" declarations from being
                 * applied to the "with" object in ES3-non-conformant browsers
                 * (really only Safari < 3) */
                if ((importsLocal || exportsLocal) && !iojs)
                    text = "(function () {" + text + "}).apply(this, arguments)";
                if (iojs)
                    text = "include = undefined; " + text;
                text = (
                    "(function (require, exports, module, system, print, include, imports) {" +
                        text +
                    "})"
                );
                /* annotate with the module id */
                if (id)
                    text = '/* ' + id + ' */ ' + text;
                return evalGlobal(text);
            };

            loader.resolve = function (id, baseId) {
                if (typeof id != "string")
                    throw new Error("module id '" + id + "' is not a String");
                if (!baseId) {
                    baseId = path;
                }
                if (id.charAt(0) != ".") {
                    baseId = path;
                }
                return urls.resolve(id, baseId);
            };

            loader.load = function (id) {
                if (!Object.prototype.hasOwnProperty.call(factories, id)) {
                    factories[id] = loader.evaluate(loader.fetch(id), id);
                }
                return factories[id];
            };

            loader.getPath = function () {
                return path;
            };

            return loader;
        };

        exports.Sandbox = function (options) {
            options = options || {};
            var loader = options.loader || exports.Loader(options);
            var sandboxSystem = options.system || system;
            var modules = options.modules || {};
            var debug = options.debug === true;
            var main;

            var debugDepth = 0;

            var sandbox = function (id, baseId) {

                id = loader.resolve(id, baseId);

                /* populate memo with module instance */
                if (!Object.prototype.hasOwnProperty.call(modules, id)) {


                    if (debug) {
                        debugDepth++;
                        var debugAcc = "";
                        for (var i = 0; i < debugDepth; i++) debugAcc += "+";
                        system.print(debugAcc + " " + id, 'module');
                    }

                    var exports = modules[id] = new Module();
                    var factory = loader.load(id);
                    var require = Require(id);
                    var module = {id: id};
                    var imports = {};
                    var include = Include(require, imports);
                    try {
                        factory.call(
                            exports,
                            require,
                            exports,
                            module,
                            sandboxSystem,
                            sandboxSystem.print,
                            include,
                            imports
                        );
                    } catch (exception) {
                        delete modules[id];
                        throw exception;
                    }

                    if (debug) {
                        var debugAcc = "";
                        for (var i = 0; i < debugDepth; i++) debugAcc += "-";
                        system.print(debugAcc + " " + id, 'module');
                        debugDepth--;
                    }


                }

                /* snapshot exports with requested bound methods */
                var exports = modules[id];
                var imports = new Module();
                var importsUsed = false;
                for (var name in exports) {
                    if (
                        exports[name] !== undefined &&
                        exports[name] !== null &&
                        exports[name].xChironCurryId
                    ) {
                        importsUsed = true;
                        imports[name] = (function (callback) {
                            var curried = function () {
                                return callback.apply(
                                    this,
                                    [baseId].concat(Array.prototype.slice.call(arguments, 0))
                                );
                            };
                            curried.xChironCurryId = callback;
                            return curried;
                        })(exports[name].xChironCurryId);
                    } else {
                        imports[name] = exports[name];
                    }
                }

                if (!importsUsed)
                    imports = exports;

                return imports;
            };

            var Require = function (baseId) {
                var require = function (id) {
                    try {
                        return sandbox(id, baseId);
                    } catch (exception) {
                        if (exception && !exception.message)
                            exception.message = 'Error';
                        try {
                            try {
                                eval("throw new Error()");
                            } catch (deliberate) {
                                if (deliberate.lineNumber !== undefined)
                                    exception.message += ' at ' + (exception.lineNumber - deliberate.lineNumber + 1);
                            }
                            exception.message += ' in ' + baseId;
                        } catch (ignore) {
                        }
                        throw exception;
                    }
                };

                require.loader = loader;

                /* extensions */
                require.xChironModule = Module;
                require.xChironId = baseId;
                require.main = main;
                require.xChironCurryId = function (callback) {
                    var curried = function () {
                        return callback.apply(
                            this,
                            [baseId].concat(Array.prototype.slice.call(arguments))
                        );
                    };
                    curried.curryId = callback;
                    return curried;
                };
                require.xChironIsLoaded = function (id) {
                    return Object.prototype.hasOwnProperty.call(modules, urls.resolve(id, baseId));
                };
                return require;
            };

            var Include = function (require, imports) {
                return function (id) {
                    var exports = require(id);
                    for (var name in exports) {
                        imports[name] = exports[name];
                    };
                    return exports;
                };
            };

            sandbox.main = function (id, baseId) {
                main = loader.resolve(id, baseId);
                return sandbox(main);
            };

            /* just for use as a base prototype */
            var Module = function () {};

            return sandbox;
        };

        /* execUrl is a utility method of this ipmlementation, not necessary
         * for the interoperable modules specification. */
        exports.execUrl = function (url, PATH, sandboxSystem) {

            /* populate a list of initial ids from the query string of the PATH */
            var mainIds = [];
            var url = urls.parse(url);
            if (url.query != "") {
                mainIds = url.query.split("&");
                if (/^path=(.*)/.test(mainIds[0])) {
                    PATH = urls.resolve(/^path=(.*)/.exec(mainIds[0])[1], system.window.location.href);
                    mainIds.shift();
                }
            }

            /* load main modules */
            sandboxSystem.moduleFactories = system.moduleFactories || {};
            var sandbox = exports.Sandbox({
                path: PATH,
                importsLocal: true,
                exportsLocal: true,
                system: sandboxSystem//,
                //factories: sandboxSystem.moduleFactories
            });
            for (var i = 0; i < mainIds.length; i++) {
                try {
                    sandbox.main(mainIds[i], system.window.location.href);
                } catch (exception) {
                    sandboxSystem.print('' + exception, 'error');
                    throw exception;
                }
            }

            /* notify the user that all main modules have finished loading */
            sandboxSystem.print('ready', 'info');

        };

    };

    factories.environment = function (require, exports, system) {

        if (system.window) {
            var window = system.window;
            var navigator = window.navigator;

            exports.isIE = navigator.appVersion.indexOf("MSIE") >= 0;
            exports.isSafari = navigator.appVersion.indexOf("Safari") >= 0;
            exports.isOpera = !!window.opera;
        }

    };

    factories.console = function (require, exports, system) {

        var window = system.window;
        var console = system.console || window.console;

        /*** exports
        */
        exports.messages = [];

        /*** print

            accepts:
             - a ``message`` and 
             - an optional ``label``.

            The label, by convention, is one of `"log"``, ``"info"``,
            ``"warn"``, or ``"error"``.  Custom loggers treat labels like
            ``"module"``, ``"pass"``, or ``"fail"``.  Attempts to write
            the message to `window.console`, progressively handling
            `console` implementations that provide a function for the 
            given ``label``, or defaulting to `log` depending on
            availability.

            Also adds a ``[message, label]`` array to the end
            of `messages`.  ``label`` is one of ``"log"``,
            ``"warn"``, ``"info"``, or ``"error"`` by convention.
            In Safari, `log` writes to the Javascript debug console, which
            is only available if you set the preference::

                defaults write com.apple.Safari IncludeDebugMenu 1

            Or in Safari 3::

                defaults write com.apple.Safari IncludeDevelopMenu 1

            And in Safari 4, the preference has been exposed
            in the Advanced tab; check "Show Develop Menu".

            In Firefox, you can get a debug console with Firebug,
            http://getfirebug.com.

            You can override the behavior of `log` by assigning
            a different function to ``require('environment').log``
            in any module.

            Chiron can create a debug console for the purpose of
            unit testing or page debugging.  To debug a web page,
            use `modules.js` to include `debug.js` on a page.
            To run a unit test, view `run.html`, `lite.html`,
            or `edit.html` with the `moduleId` of the unit test
            as a query string.

        */
        exports.print = function (message, label) {

            label = label || 'log';

            /*
                buffer messages so that console overrides
                can retrieve and display them later.
            */
            exports.messages.push([message, label]);

            /*
                attempt to send the message to window.console if it
                exists, progressively handling the availability
                of a logging function crafted especially for the
                requested label, or defaulting to 'log'.
            */

            if (console) {
                if (console.print) {
                    console.print(message, label);
                } else if (console[label]) {
                    console[label](message);
                } else if (console.log) {
                    console.log(message);
                }
            }

        };

    };

    factories.browser = function (require, exports, system) {

        var environment = require('environment');
        var window = system.window;
        var document = window.document;
        var top = window.top;

        exports.hasAttr = function (element, key) {
            if (element.hasAttribute) {
                exports.hasAttr = function (element, key) {
                    return element.hasAttribute(key);
                };
                return exports.hasAttr(element, key);
            } else {
                exports.hasAttr = function (element, key) {
                    var node = element.getAttributeNode(key);
                    return node && node.specified;
                };
                return exports.hasAttr(element, key);
            }
        };

        var isDomReady = false;
        exports.observeDomReady = function (callback) {

            /* call immediately if we've already noted a DOM
             * ready event */
            if (isDomReady)
                return callback();

            /* arrange to call back exactly once, even if multiple
             * methods of detecting dom completion call "ready" */
            var hasCalledBack = false;
            var ready = function () {
                if (hasCalledBack)
                    return;
                hasCalledBack = true;
                isDomReady = true;
                callback();
            };

            /*
                wait for the DOM and CSS to be ready, but don't wait
                for images unless they're absolutely necessary.
                
                ported from jQuery's event.js, with previous implementations
                taking from similar sources, including Dean Edwards
                and PPK.
            */

            /*
                Opera uses DOMContentLoaded but has special code for
                pending style sheets.
            */
            if (environment.isOpera)
                document.addEventListener("DOMContentLoaded", function () {
                    if (isDomReady) return;
                    for (var i = 0; i < document.styleSheets.length; i++)
                        if (document.styleSheets[i].disabled) {
                            window.setTimeout(arguments.callee, 0);
                            return;
                        }
                    // and execute any waiting functions
                    ready();
                }, false);

            /* Mozilla and WebKit nightlies currently support this event */
            if (document.addEventListener)
                /* Use the handy event callback */
                document.addEventListener("DOMContentLoaded", ready, false);

            /*
                If IE is used and is not in a frame,
                continually check to see whether the document is ready.
            */
            if (environment.isIE && window == top) (function () {
                if (isDomReady) return;
                try {
                    /*
                        If IE is used, use the trick by Diego Perini
                        http://javascript.nwbox.com/IEContentLoaded/
                    */
                    document.documentElement.doScroll("left");
                } catch (error) {
                    /*
                        using setTimeout with a 0 milisecond dellay
                        is effectively the equivalent of a "yield"
                        in a cooperative multi-task language.
                        This permits the browser to breathe before
                        we check whether we're ready again.
                    */
                    window.setTimeout(arguments.callee, 0);
                    return;
                }
                ready();
            })();

            if (environment.isSafari) {
                (function () {
                    if (isDomReady) return;
                    if (
                        document.readyState != "loaded" &&
                        document.readyState != "complete"
                    ) {
                        window.setTimeout(arguments.callee, 0);
                        return;
                    }
                    var numStyles = document.getElementsByTagName('style').length;
                    var links = document.getElementsByTagName('link');
                    for (var i = 0; i < links.length; i++) {
                        var link = links[i];
                        numStyles += (
                            link.hasAttribute('rel') &&
                            link.getAttribute('rel').toLowerCase() ==
                            'stylesheet'
                        );
                    }
                    if (document.styleSheets.length != numStyles) {
                        window.setTimeout(arguments.callee, 0);
                        return;
                    }
                    ready();
                })();
            }

            /*
                for other browsers, give up on the time saving
                techniques and wait for all the images to load.
                also, do this in other browsers just in case they missed
                the boat.
            */
            if (window.onload) {
                /* if there's already an onload listener, call ready after it,
                preserving first-come-first-serve event observation */
                window.onload = (function (onload) {
                    return function () {
                        onload.call(this);
                        ready();
                    };
                })(window.onload);
            } else {
                window.onload = ready;
            }

        };

    };

    factories.urls = function (require, exports, system) {
        
        /**** keys
            members of a parsed URI object.
        */
        exports.keys = [
            "url",
            "protocol",
            "authorityRoot",
            "authority",
                "userInfo",
                    "user",
                    "password",
                "domain",
                    "domains",
                "port",
            "path",
                "root",
                "directory",
                    "directories",
                "file",
            "query",
            "anchor"
        ];

        /**** expressionKeys
            members of a parsed URI object that you get
            from evaluting the strict regular expression.
        */
        exports.expressionKeys = [
            "url",
            "protocol",
            "authorityRoot",
            "authority",
                "userInfo",
                    "user",
                    "password",
                "domain",
                "port",
            "path",
                "root",
                "directory",
                "file",
            "query",
            "anchor"
        ];

        /**** strictExpression
        */
        exports.strictExpression = new RegExp( /* url */
            "^" +
            "(?:" +
                "([^:/?#]+):" + /* protocol */
            ")?" +
            "(?:" +
                "(//)" + /* authorityRoot */
                "(" + /* authority */
                    "(?:" +
                        "(" + /* userInfo */
                            "([^:@]*)" + /* user */
                            ":?" +
                            "([^:@]*)" + /* password */
                        ")?" +
                        "@" +
                    ")?" +
                    "([^:/?#]*)" + /* domain */
                    "(?::(\\d*))?" + /* port */
                ")" +
            ")?" +
            "(" + /* path */
                "(/?)" + /* root */
                "((?:[^?#/]*/)*)" +
                "([^?#]*)" + /* file */
            ")" +
            "(?:\\?([^#]*))?" + /* query */
            "(?:#(.*))?" /*anchor */
        );

        /**** Parser
            returns a URI parser function given
            a regular expression that renders 
            `expressionKeys` and returns an `Object`
            mapping all `keys` to values.
        */
        exports.Parser = function (expression) {
            return function (url) {
                if (typeof url == "undefined")
                    throw new Error("HttpError: URL is undefined");
                if (typeof url != "string") return new Object(url);

                var items = {};
                var parts = expression.exec(url);

                for (var i = 0; i < parts.length; i++) {
                    items[exports.expressionKeys[i]] = parts[i] ? parts[i] : "";
                }

                items.root = (items.root || items.authorityRoot) ? '/' : '';

                items.directories = items.directory.split("/");
                if (items.directories[items.directories.length - 1] == "") {
                    items.directories.pop();
                }

                /* normalize */
                var directories = [];
                for (var i = 0; i < items.directories.length; i++) {
                    var directory = items.directories[i];
                    if (directory == '.') {
                    } else if (directory == '..') {
                        if (directories.length && directories[directories.length - 1] != '..')
                            directories.pop();
                        else
                            directories.push('..');
                    } else {
                        directories.push(directory);
                    }
                }
                items.directories = directories;

                items.domains = items.domain.split(".");

                return items;
            };
        };

        /**** parse
            a strict URI parser.
        */
        exports.parse = exports.Parser(exports.strictExpression);

        /**** format
            accepts a parsed URI object and returns
            the corresponding string.
        */
        exports.format = function (object) {
            if (typeof(object) == 'undefined')
                throw new Error("UrlError: URL undefined for urls#format");
            if (object instanceof String || typeof(object) == 'string')
                return object;
            var domain =
                object.domains ?
                object.domains.join(".") :
                object.domain;
            var userInfo = (
                    object.user ||
                    object.password 
                ) ?
                (
                    (object.user || "") + 
                    (object.password ? ":" + object.password : "") 
                ) :
                object.userInfo;
            var authority = (
                    userInfo ||
                    domain ||
                    object.port
                ) ? (
                    (userInfo ? userInfo + "@" : "") +
                    (domain || "") + 
                    (object.port ? ":" + object.port : "")
                ) :
                object.authority;
            var directory =
                object.directories ?
                object.directories.join("/") :
                object.directory;
            var path =
                directory || object.file ?
                (
                    (directory ? directory + "/" : "") +
                    (object.file || "")
                ) :
                object.path;
            return (
                (object.protocol ? object.protocol + ":" : "") +
                (authority ? "//" + authority : "") +
                (object.root || (authority && path) ? "/" : "") +
                (path ? path : "") +
                (object.query ? "?" + object.query : "") +
                (object.anchor ? "#" + object.anchor : "")
            ) || object.url || "";
        };

        /**** resolveObject
            returns an object representing a URL resolved from
            a relative location and a base location.
        */
        exports.resolveObject = function (relative, base) {
            if (!base) 
                return relative;

            base = exports.parse(base);
            relative = exports.parse(relative);

            if (relative.url == "")
                return base;

            delete base.url;
            delete base.authority;
            delete base.domain;
            delete base.userInfo;
            delete base.path;
            delete base.directory;

            if (
                relative.protocol && relative.protocol != base.protocol ||
                relative.authority && relative.authority != base.authority
            ) {
                base = relative;
            } else {
                if (relative.root) {
                    base.directories = relative.directories;
                } else {

                    var directories = relative.directories;
                    for (var i = 0; i < directories.length; i++) {
                        var directory = directories[i];
                        if (directory == ".") {
                        } else if (directory == "..") {
                            if (base.directories.length) {
                                base.directories.pop();
                            } else {
                                base.directories.push('..');
                            }
                        } else {
                            base.directories.push(directory);
                        }
                    }

                    if (relative.file == ".") {
                        relative.file = "";
                    } else if (relative.file == "..") {
                        base.directories.pop();
                        relative.file = "";
                    }
                }
            }

            if (relative.root)
                base.root = relative.root;
            if (relative.protcol)
                base.protocol = relative.protocol;
            if (!(!relative.path && relative.anchor))
                base.file = relative.file;
            base.query = relative.query;
            base.anchor = relative.anchor;

            return base;
        };

        /**** relativeObject
            returns an object representing a relative URL to
            a given target URL from a source URL.
        */
        exports.relativeObject = function (target, base) {
            target = exports.parse(target);
            base = exports.parse(base);

            delete target.url;

            if (
                target.protocol == base.protocol &&
                target.authority == base.authority
            ) {
                delete target.protocol;
                delete target.authority;
                delete target.userInfo;
                delete target.user;
                delete target.password;
                delete target.domain;
                delete target.domains;
                delete target.port;
                if (
                    !!target.root == !!base.root && !(
                        target.root &&
                        target.directories[0] != base.directories[0]
                    )
                ) {
                    delete target.path;
                    delete target.root;
                    delete target.directory;
                    while (
                        base.directories.length &&
                        target.directories.length &&
                        target.directories[0] == base.directories[0]
                    ) {
                        target.directories.shift();
                        base.directories.shift();
                    }
                    while (base.directories.length) {
                        base.directories.shift();
                        target.directories.unshift('..');
                    }

                    if (!target.root && !target.directories.length && !target.file && base.file)
                        target.directories.push('.');

                    if (base.file == target.file)
                        delete target.file;
                    if (base.query == target.query)
                        delete target.query;
                    if (base.anchor == target.anchor)
                        delete target.anchor;
                }
            }

            return target;
        };

        /**** resolve
            returns a URL resovled to a relative URL from a base URL.
        */
        exports.resolve = function (relative, base) {
            return exports.format(exports.resolveObject(relative, base));
        };

        /**** relative
            returns a relative URL to a target from a source.
        */
        exports.relative = function (target, base) {
            return exports.format(exports.relativeObject(target, base));
        };

    };

    factories.http = function (require, exports, system) {

        var urls = require('urls');
        var environment = require('environment');
        var window = system.window;

        /**** requestContent
            returns the text at a given URL using an HTTP
            request.
            supports continuation passing form for asynchronous
            requests.
        */
        exports.requestContent = function (url, observer) {
            if (observer !== undefined) {
                return exports.request(url, function (response) {
                    if (response.isOk())
                        observer(response.getContent());
                });
            } else {
                var response = exports.request(url);
                if (response.isError())
                    throw new Error("HttpError: " + url + " status " + response.getStatus());
                return response.getContent();
            }
        };

        /**** request
            sends an HTTP request to a given URL and returns
            the response.
            supports continuation passing form for asynchronous
            requests.
        */
        exports.request = function (url, observer) {
            var request = exports.Request();
            var response = request.getResponse();

            url = urls.resolve(url, system.window.location.href);

            if (observer)
                request.observe("ok", observer);

            request.open("GET", url, !!observer);

            try {
                request.send();
            } catch (exception) {
                request.abort();
                throw new Error('HttpError: "' + url + '": ' + exception);
            }

            if (observer !== undefined) {
                return request;
            } else {
                return response;
            }

        };

        /*todo
            Look deeper into dojo/src/hostenv_browser.js for 
            _blockAsync lock to prevent eternal hanging in KHTML
        */

        /**** Request
            returns a wrapped HTTP Request object.
        */
        exports.Request = function () {
            /* this line permits the user to create a request with
             * either new Request() or Request().  internally,
             * we just use the Request() so that Request can be
             * overloaded later in HTTP to be a type constructor
             * function instead of a prototype constructor */
            if (this == exports) return new exports.Request();

            var self = this;
            var method, url, asynchronous, user, password;
            var realRequest = exports.NativeRequest();
            var response = exports.Response(realRequest);
            var isOpen;
            var readyStateChanged;
            var timeout;
            var timeoutHandle;
            var aborted;

            var readyObservers = [];
            var okObservers = [];
            var errorObservers = [];
            var warnObservers = [];
            var timeoutObservers = [];

            /***** toString
            */
            self.toString = function () {return "[object HttpRequest]"};

            /***** getResponse
            */
            self.getResponse = function () {
                return response;
            };

            var signal = function (response, observers) {
                while (observers.length) {
                    var observer = observers.shift();
                    observer(response);
                }
            };

            /***** pogress
                an event function that the Request calls when it
                receives a chunk of content.
            */
            self.progress = function () {
                /* necessary: this function becomes an observable signal */
            };

            /***** ready
                an event function that the Request calls when
                the Reponse is ready.
            */
            self.ready = function () {
                signal(response, readyObservers);
            };

            /***** ok
                an event function that the Request calls when a Response
                is ready and all went well.  Note that Safari and FireFox, at least,
                will fire this event even when the connection is abruptly
                terminated by the server, reporting a 200 status and
                an empty response content.
            */
            self.ok = function () {
                signal(response, okObservers);
            };

            /***** error
                an event function that the Request calls when a Reponse
                is completed but failed to retrieve the requested content.
            */
            self.error = function () {
                signal(response, errorObservers);
            };

            /***** warn
                an event function that the Request calls when 
                something is amiss with message.
            */
            self.warn = function (message) {
                warn(message);
                signal(response, warnObservers);
            };

            /***** timeout
                an event function that Request calls when a request
                times out.  The default behavior is to invoke an error.
            */
            self.timeout = function () {
                signal(response, timeoutObservers);
            };

            /***** observe
                permits a user to observe `ready`, `ok`,
                `error`, and `warn` events with a handler
                function.  Observing any event on a `Request`
                causes the `open` and `send` to implicitly become
                asynchronous.
            */
            self.observe = function (eventName, observer) {
                asynchronous = true;
                if (eventName == "ready") readyObservers.push(observer);
                else if (eventName == "ok") okObservers.push(observer);
                else if (eventName == "error") errorObservers.push(observer);
                else if (eventName == "warn") warnObservers.push(observer);
                else if (eventName == "timeout") timeoutObservers.push(observer);
                else throw new Error(
                    "HttpError: event name '" + eventName + "' " +
                    "is not recognized"
                );
            };

            /***** setHeader
            */
            self.setHeader = function (key, value) {
                realRequest.setRequestHeader(key, value);
            };

            /***** isOpen
            */
            self.isOpen = function () {
                return isOpen;
            };

            /***** isSent
            */
            self.isSent = function () {
                return realRequest.readyState > 0;
            };

            /***** getTimeout
            */
            self.getTimeout = function () {
                return timeout;
            };

            /***** setTimeout
            */
            self.setTimeout = function (value) {
                timeout = value;
            };

            /***** open

                Accepts

                 - ``method``, an HTTP request method, for example,
                   ``GET``, ``POST``, ``PROPFIND`` and others.
                 - ``url``, a web location string
                 - ``synchronous``, whether ``send`` will block until completed,
                   for example, ``synchronous``, ``asynchronous``.
                 - ``user``, an optional HTTP user name.
                 - ``password``, an optional HTTP password.

            */
            self.open = function (_method, _url, _asynchronous, _user, _password) {
                try {
                    return realRequest.open(
                        method = _method,
                        url = _url,
                        asynchronous = _asynchronous,
                        user = _user,
                        password = _password
                    );
                } finally {
                    isOpen = true;
                }
            };

            /***** send
                Accepts an optional ``content`` argument for requests like ``POST`` method.
            */
            self.send = function (content) {

                realRequest.setRequestHeader("X-Requested-With", "XMLHttpRequest");

                if (!content) {
                    content = "";
                }

                if (timeout !== undefined) {
                    timeoutHandle = window.setTimeout(function () {
                        timeoutHandle = undefined;
                        var status = response.getStatus();
                        if (status != 200 || status === undefined) {
                            self.timeout();
                            self.abort();
                        }
                    }, timeout);
                }

                return realRequest.send(content);
            };

            /***** abort
            */
            self.abort = function () {
                if (timeoutHandle !== undefined)
                    window.clearTimeout(timeoutHandle);
                aborted = true;
                return realRequest.abort();
            };

            realRequest.onreadystatechange = function () {
                readyStateChanged = true;

                self.progress();

                if (aborted) {
                    free();
                } else if (realRequest.readyState == 4) {
                    try {

                        self.ready(response);

                        if (response.isOk()) {
                            self.ok(response);
                        } else {
                            self.error(response);
                        }

                    } catch (exception) {
                        system.print(exception.message || exception, 'error');
                    }
                    free();
                }
            };

            var free = function () {
                delete realRequest['onreadystatechange'];
                realRequest.onreadystatechange = undefined;
            };

            return self;
        };

        /**** Response
            returns a wrapped HTTP Response object.
        */
        exports.Response = function (realRequest) {
            /* this line permits the user to create a request with
             * either new Respones() or Response().  internally,
             * we just use the Response() so that Response can be
             * overloaded later in HTTP to be a type constructor
             * function instead of a prototype constructor */
            if (this == exports) return new exports.Response(realRequest);

            var self = this;

            /* this init function doesn't get invoked until Response becomes
             * a type in HTTP.  so, this method is merely for the future. */
            self.init = function (realRequestValue) {
                realRequest = realRequestValue;
            };

            /***** isReady
                whether the request is finished.  This indicates
                whether you can call `getStatus`
            */
            self.isReady = function () {
                return realRequest.readyState == 4;
            };

            /***** getStatus
                returns the HTTP response code.  Local files
                return 0.  Returns ``undefined`` if the
                underlying XML HTTP request throws an exception,
                `getStatus` returns ``undefined``.
            */
            self.getStatus = function () {
                /* one wouldn't think this were necessary.
                 * one would be wrong. */
                try {
                    return realRequest.status;
                } catch (exception) {
                    return undefined;
                }
            };

            /***** isOk
                returns whether a request had a valid response.
                This usually is indicative of a 200 HTTP response
                code, but there are variations among browsers.

                HTTP Status codes in the interval [200, 300] are all legal
                HTTP Ok responses. 

                In Firefox and Safari 3, local files acquired with an HTTP request
                have a status code of 0.

                In Safari 2, local files acquired with an asynchronous HTTP
                request have a status of undefined.

                In Safari, a response with no content causes a status
                of `undefined`.

                Konqueror requires acceptance of 304, "using cache",
                according to dojo/src/hostenv_browser.js

                According to jQuery issue #1450, IE sometimes 1223
                instead of 204.
            */
            self.isOk = function () {
                var status = self.getStatus();
                return (
                    /* usually */
                    status >= 200 && status < 300 ||
                    /* Firefox and Safari 3 file:// */
                    status == 0 ||
                    /* Konqueror using cache */
                    status == 304 ||
                    /* IE bug 1223 */
                    status == 1223 ||
                    /* Safari 2 asynchronous file:// and
                      all Safari for no file content */
                    (environment.isSafari && status == undefined && (
                        /^file:\/\//.test(url) ||
                        realRequest.responseText == ""
                    ))
                );
            };

            /***** isError
            */
            self.isError = function () {
                return !self.isOk();
            };

            /***** getContent
            */
            self.getContent = function () {
                return realRequest.responseText;
            };

            /***** getDocument
            */
            self.getDocument = function () {
                return self.getXml().documentElement;
            };

            /***** getHeader
            */
            self.getHeader = function (key) {
                return realRequest.getResponseHeader(key);
            };

            /***** hasHeader
            */
            self.hasHeader = function (key) {
                return realRequest.getResponseHeader(key) != undefined;
            };

            /***** getHeaders
            */
            self.getHeaders = function () {
                var headers = realRequest.getAllResponseHeaders();
                if (!headers) return {};
                return headers;
            };

            /***** len
            */
            self.len = function () {
                return realRequest.responseText.length;
            };

        };

        /*** NativeRequest
            returns an XMLHttpRequest in most browsers.
        */
        /* Based on dojo/src/hostenv_browser.js */

        exports.NativeRequest = function () {
            /*

                subscribes to the lazy function definition pattern, since it
                redefines itself as the first method that works on the first
                call.

                Some other AJAX implementations check
                 - Msxml2.XMLHTTP.6.0
                 - Msxml2.XMLHTTP.5.0
                 - Msxml2.XMLHTTP.4.0
                 - Msxml2.XMLHTTP.3.0
                 - Microsoft.XMLHTTP

                Microsoft.XMLHTTP is an older name-space, but is equivalent to
                the more lucid Msxml2.XMLHTTP.3.0 and only available when the
                latter is available too.

                Msxml2.XMLHTTP.4.0 has been superseded and is currently only
                intended to support legacy applications.

                Msxml2.XMLHTTP.5.0 was shipped with MS Office 2003 and was
                intended for Office applications. IE7 has this component off
                by default in the Internet zone, leading to canary-yellow
                verification dialogs.

                Msxml2.XMLHTTP.6.0 is currently the standard MS is pushing.
                I originally left out 6.0 since it would increase the burden
                of testing for functionality that cannot be trusted to work
                in all browsers.
                However, I've taken Jonathan Snook's advice to check for
                Microsoft's latest and greatest.

                see: http://snook.ca/archives/javascript/xmlhttprequest_activex_ie/

                Msxml2.XMLHTTP.3.0 is the most widely deployed version and is
                serviced regularly with the OS for security and other reasons.
                It is MS's preferred alternative to MSXML6.

                see: http://blogs.msdn.com/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx

                see: http://www.telerik.com/documents/AJAX%20Page/Ajax-Part1.pdf page 3

            */

            var trials = [
                function () {return new window.XMLHttpRequest()},
                function () {return new window.ActiveXObject("Msxml2.XMLHTTP.6.0")},
                function () {return new window.ActiveXObject("Msxml2.XMLHTTP.3.0")},
                function () {throw new Error("No HTTP Request object available for your system.")}
            ];

            var trial, result, exception;
            for (var i = 0; i < trials.length; i++) {
                exception = undefined;
                /* redeclare for posterity */
                exports.NativeRequest = trial = trials[i];
                try {
                    result = trial();
                } catch (trialException) {
                    exception = trialException;
                    continue;
                }
                break;
            }

            if (exception) throw exception;
            else return result;
        };

    };

    if (typeof exports == "undefined") {
        require('main');
    }

/* end of module enclosure */
})(function () {
    return eval(arguments[0]);
});

