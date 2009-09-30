
Deploying Modules to Browsers
=============================

/!\ Warning: most of the techniques described below have not yet been implemented.  This document sets forth the design for a variety of solutions.

There are a myriad of ways to deploy Narwhal modules to web browsers, although none of them are as familiar as adding the module files with script tags.

The ideal loader would work for both development or production, with static files hosted by your media server or CDN or with files served by your web application, both in modules and in subsequent inline script tags with or without a load event handler, with blocking calls to require and non-blocking calls to require, and with high performance always, both on the initial page load and on subsequent page loads mostly from cache, and with the minimal download size.

 * development or production
 * static or dynamic
 * synchronous or asynchronous
 * bundled, combined, or individual
 * minified or debugable
 * same origin, media server, CDN

Since many of these requirements are mutually exclusive, there is not a single loader that will work for every situation.  This document is intended to describe the loader you should use for each particular scenario, and to describe how those loaders work.


Usage
-----

If you are using a JSGI server, you can let Narwhal's `narwhal/server` application embed light-weight module loaders in your HTML.  Using this application, the syntax for various use cases remains the same across all configurable scenarios.

    var app = ...
    var server = require("narwhal/server");
    app = server.App(app, options);
    ...

Wherever you install this App on your request routing, the app will intercept any requests on the "/javascript" path.  Otherwise, the application tracks the `env.SCRIPT_NAME` at that point in the request router so it can construct URL's for the modules.  The "/javascript" path is configurable.

    app = server.App(app, {
        "path": "/.js"
    });

The most simple use case embeds a loader that will asynchronously load your main module and its transitive dependencies and then "require" the main module.

    <script>{env.require('main')}</script>

If you want to asynchronously preload a set of modules and their transitive dependencies, you can embed a nonblocking preloader and observe a ready signal in subsequent inline scripts.

    <script>{env.require.nonblock(['foo', 'bar/baz'])}</script>
    <script>
        require.ready(function () {
            var foo = require("foo");
            var baz = require("bar/baz");
        });
    </script>

If you want to syncronously preload a set of modules and their transitive dependencies, you can embed a blocking preloader.  Because of technical limitations, this technique is not available in production with modules hosted statically.  In other scenarios, this technique is not advisable since the modules are not very cacheable.  When used at all, this technique should only be used at the bottom of the HTML `<body>` tag because it prevents most modern browsers from queueing the download of subsequent static resources in the HTML stream.

    <script>{env.require.block(['foo', 'bar/baz'])}</script>
    <script>
        (function () {
            var foo = require("foo");
            var baz = require("bar/baz");
        })();
    </script>

You can use "require.async" and the "promise" module to load modules with calculated identifiers (as opposite to statically analyzable String literal identifiers, like `require("foo")`).

    var Q = require("promise");

    exports.plugin = function (name) {
        return require.async("plugins/" + name);
    };

    Q.when(exports.plugin("widget"), function (widget) {
    });


Development
-----------

For debugging, you want line numbers, file names, and the original source code.  Performance is not as much of a concern, but you would like it to resemble the user experience.  It would also be optimal if you did not have to perform a build step or restart your web server between writing code and debugging your application.

You can configure the server application to run in debug mode when Narwhal is in debug mode, as set with the `-d` or `--debug` command line switches.

    app = server.App(app, {
        "debug": system.debug
    });

You can pass any `Boolean` value to the `App` options to configure it for debug scenarios.


### Server Component ###

If you are using a JSGI server, you can use Narwhal's server application to host the individual modules dynamically.  The application also sends updated versions of your modules when they change.  For performance, the server induces browser caching by selecting a unique URL and an expiration date in the distant future.  The module loader provides a global "require" function.

Each individual module will be wrapped by the server in a bit of code that will register the module factory with the loader.  This defers execution of the module and adds it to the loader's module factory table.  To avoid interfering with line numbers, the server condenses the entire boilerplate onto a single line.

    require.register({ // no newline
        "bar/baz": // no newline
        function (require, exports, module, system, print) { // no newline
            // module text here
            // */ and newline here to break out of comments
        }
    });

In the ideal deployment scenario, you have separated your frontend concerns among behavior (JavaScript), content (raw HTML), and presentation (HTML and CSS).  This suggests that each page would have a cacheable module for its programmatic beahvior.  The Narwhal server application favors the syntax for this use case, enabling you to embed a small preloader with the necessary data about the main module and its static dependency graph, automatically loading the "main" module when all of its dependencies have arrived.

    <script>{env.require('main')}</script>

If you prefer to embed behavior in your HTML, you can embed a preloader and use the ready signal in subsequent inline scripts.  Each of the modules and their transitive dependencies will be registered asynchronously and the `ready` signal will be sent when they have all been registered.

    <script>{env.require.nonblock(["foo", "bar/baz"])}</script>
    <script>
        require.ready(function () {
            var foo = require("foo");
            var baz = require("bar/baz");
        });
    </script>

If you absolutely must have a blocking script tag for your modules, the application optionally can download all of the dependencies in a single file, but the price is performance and that your line numbers and file names will no longer correspond with the source.  You are unlikely to benefit from browser caching, and it would be unwise to use a blocking script download anywhere but the bottom of the page.

    ...
        <script src="{env.require.block('foo', 'bar/baz')">
        </script>
        <script>
            (function () {
                var foo = require("foo");
                var baz = require("bar/baz");
            })();
        </script>
    </body>

There is also an option that will allow you to embed the module factories directly in the text of your HTML, that guarantees blocking but prevents caching.

    ...
        <script>{env.require.embed("foo", "bar/baz")}</script>
        <script>
            (function () {
                var foo = require("foo");
                var baz = require("bar/baz");
            })();
        </script>
    </body>


### Build Step ###

If you can not use a server side component, but you are willing to perform a build step every time you go from writing code to debugging, Narwhal has Tusk commands that will assist deployment.

One Tusk command generates a script media directory composed of module factories for the modules of higest precedent for each top level identifier in every package, for the browser engine.

    $ tusk browser --debug build [<target>]

Another Tusk command generates code snippets to include in your HTML to load these modules.

    $ tusk browser --debug require <id>
    $ tusk browser --debug block [<id> [...]]
    $ tusk browser --debug nonblock [<id> [...]]
    $ tusk browser --debug embed [<id> [...]]


### Static Files ###

If you can not use a server side component and are not willing to perform a build step, but are willing to sacrifice meaningful line numbers and file names in many browsers and to constrain yourself to serving modules from the same host as the origin document, Narwhal provides a loader that can even be used to run modules on the local file system directly from the web browser.  You will need to run a Tusk command to construct a directory that contains a symbolic link to every Narwhal module path so the client can search for modules.

    $ tusk browser build-path

This creates "media/js/{n}/" symlinks in numeric order for each of the directories in `require.paths` for a browser deployment.  The client has to make a `HEAD` request for the top level identifier of the module in each subdirectory until it finds the module and issues a `GET`.  All of these operations are performed with a blocking XML HTTP Request, which is fine for debugging but very low performance, with many round trips, no parallelism or bundling, and the risk of locking up the entire browser user interface in browsers that can't handle a situation where a synchronous HTTP request is made and the server never responds [citation needed].

Then loading a main module is a matter of adding a blocking script with the main module as a query string.

    <script src="/media/js/modules.js?foo"></script>


Production
----------

In production, all techniques minify modules before sending them to the browser.

If you can use a server-side component and you are willing to serve your modules from your origin document server instead of a static media server, the method for hosting those files is similar to hosting those files from the server in developer mode.  The key difference is that the server minifies the modules.

With this architecture, in the future it will be possible to write a smarter module loader that will balance the cost of downloading modules serially as a bundle or individually in parallel by maintaining knowledge in persistent session storage about which individual modules have been presumably cached by the browser.  Initial page loads would be expedited by bundling.  The client would wait an interval and begin redownloading individual modules, which would be tracked by the server in persistent session storage.  On subsequent pages, the server would decide, based on what it knows is present in the browser cache, whether to send individual modules or a bundle.

    app = session.App(app);
    app = server.App(app, {
        "sessionNamespace": "require",
        "cacheReloaderDelay": 2000 // miliseconds
    });

If you are using a CDN, you can use the same technique as above, serving the JavaScript from origin (where the CDN will look for cache misses) and with CDN URLs (so the client looks for the modules on the CDN).  You will need to configure the CDN and the Narwhal server to know about each other.  The CDN will need to be configured to look for JavaScript modules on your origin server.  The Narwhal application will need to be configured to write CDN URLs instead of origin server URLs.

    app = server.App(app, {
        "proxy": "http://your.content-delivery.net/work/js"
    });

With this architecture, it will be possible in the future to implement a smarter loader that can be configured to proactively invalidate URLs from the proxy's cache by issuing `POST` and `DELETE` HTTP requests to the proxy from the origin server.

If you would like to host certain modules from other URL's, like common libraries from a free CDN, you can configure the server application to use alternate URLs to load particular individual module factories or factory combinations or bundles.  This will hypothetically improve cacheability of certain modules across sites.

    app = server.App(app, {
        "catalog": {
            "jquery": "http://example.net/js/jquery-1.6.js"
        }
    });


### Build Step ###

If your solution must be static with no server-side component, as would be needed to serve from a static media server, you will need to use a Tusk build step to overlay the library directories of all packages into a single directory tree.

    $ tusk browser build [<target>]

You will also need to configure the server to look for individual modules in that directory tree, so it can configure the embedded loaders properly.

    app = server.App(app, {
        "static": "/media/js"
    })

If you cannot use the JSGI application to construct module loader embeddings, you can generate loader snippets with Tusk as well.  Each of these snippets can be placed in a `<script>` tag in your HTML.

    $ tusk browser require <id>
    $ tusk browser nonblock [<id> [...]]
    $ tusk browser embed [<id> [...]]

You can configure Tusk to use an alternate media path with command line options:

    $ tusk browser --media/js <alternate-path> ...

With a static loader, it is not possible to serve dynamically created bundles, so you cannot use `env.require.block(ids)`.  However you can generate bundles with Tusk.

    $ tusk browser bundle <target> [<id> [...]]

The bundle command does not search for static dependencies, on the presumption that you might create combinations of bundles with some common dependencies.  You can use Tusk to scan the transitive dependencies of a module in the browser engine:

    $ tusk browser dependencies <id>

The list will begin with the selfsame identifier so you can pass it directly to the bundler with `xargs`.

    $ tusk browser dependencies <id> |\
        tusk browser bundle media/js/bundle-<id>.js

If you have a bundle, you can create a snippet that will block the browser until the entire bundle has been registered, just as you would get from `require.block`.

    $ tusk browser block [<bundle-id>]


Background
----------

This design is based on several propositions:

 * synchronous XHR -> blocks most HTML parsers, delaying subsequent static resource enqueue -> bad for performance -> bad for production
 * synchronous XHR -> breaks browsers when the server fails to respond -> bad for reliability -> bad for production
 * XHR -> same origin limitation -> not feasible for static media server or CDN -> sometimes bad for production
 * asynchronous XHR -> does not block browser parsing -> not bad for production
 * asynchronous XHR -> paired with eval, does not need module factory boilerplate
 * asynchronous XHR -> does not preserve file names -> bad for development
 * script injection -> requires module factory boilerplate -> build step OR module server
 * script injection -> line numbers and file names preserved -> good for development
 * build step -> bad for development
 * module server -> not statically deployable -> only good for production in conjunction with a CDN
 * CDNs and static files are distinct deployment scenarios
 * individual modules -> cacheable -> good for subsequent page loads
 * individual modules -> chatty (round trip between requests) -> bad for initial page loads
 * bundles -> less chatty (fewer round trips) -> faster download -> good for initial page loads
 * bundles -> less cacheable -> not good for subsequent page loads
 * balancing bundles, combos, and individuals -> server side logic and session state required
 * combinations -> more cacheable than bundles AND less cacheable than individual modules
 * embedding -> not cacheable -> bad for production
 * minification -> changes line numbers -> bad for development
 * minification -> decreases download size -> good for production
 * embeded scripts -> not cacheable -> bad for performance -> bad for production
 * blocking script -> bundle OR synchronous XHR
 * static files -> build step -> bad for debug

    +--------------------+------------------+--------------+
    | Debug / Production | Static / Dynamic | Sync / Async |
    +-------+------------+--------+---------+------+-------+
    | Debug |            | Static |         | Sync |       |
    +-------+------------+--------+---------+------+-------+
    | Debug |            | Static |         |      | Async |
    +-------+------------+--------+---------+------+-------+
    | Debug |            |        | Dynamic | Sync |       |
    +-------+------------+--------+---------+------+-------+
    | Debug |            |        | Dynamic |      | Async | 
    +-------+------------+--------+---------+------+-------+
    |       | Production | Static |         | Sync |       | production and synchronous (by way of bundling or sync XHR) are incompatible
    +-------+------------+--------+---------+------+-------+
    |       | Production | Static |         |      | Async | build step
    +-------+------------+--------+---------+------+-------+
    |       | Production |        | Dynamic | Sync |       | production and synchronous (by way of bundling or sync XHR) are incompatible
    +-------+------------+--------+---------+------+-------+
    |       | Production |        | Dynamic |      | Async | module server
    +-------+------------+--------+---------+------+-------+

