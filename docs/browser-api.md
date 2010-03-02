
Browser Deployment
==================

To use modules on the client side, one option is to use a
JSGI application provided with Narwhal.

    var SERVER = require("narwhal/server");
    var app = ...
    app = SERVER.App(app, options);
    ...

Options:

 * `debug`: causes the loader to favor debug information over
   performance.  This disables bundling, minification,
   and caching (maybe).
 * `path`: overrides the path used for server-hosted modules.
   For example, "javascript/" instead of the default, ".js/".
   This is intended to avoid collisions with existing services
   down the routing cascade.
 * `proxy`: Alternate URL to search for scripts.

This option has not been implemented yet:

 * `catalog`: Alternate URLs for individual scripts or
   script bundles.

This introduces an API to the "env" for all subsequent
poritions of the request route.  The first form loads a module
and its transitive dependencies:

    env.script.require(id)

The second form aynchronously loads the given modules and
their transitive dependencies, but does not invoke any
of them.

    env.script.preload([id...])

You can also embed a call to require a module and its transitive dependencies
instead of loading them with asynchronous script injection.

    env.script.embed("main")

If you just need to install the loader and you intend to use the loader
manually, you can inject it.  The `script.loader` function will return a bit of
JavaScript that will return an expression that evaluates to the `require`
object in JavaScript.  The first time it's called, this will be the full text
of the loader, but thereafter it will simply be the global `require` variable.

    env.script.loader()

These functions return unescaped JavaScript text
suitable for inserting in an HTML `<script>` tag.  The intent
is for you to use these functions through whatever template
formatting system your site uses, as in this speculative
example:

    <script>{{env.script.require("main")|javascript}}</script>

Or, with a higher level API that could be implemented to look like:

    { % script.require "main" % }

If you intend to use modules in inline scripts, you will need to wait for the
desired modules to load before you execute your code.  The `require.when`
function executes a block of code when a module is *ready* to be required.

    <script>
        require.when("main", function () {
            var MAIN = require("main");
            ...
        });
    </script>

You can also use promises directly with the `require.async` call, which
performs an asynchronous require that fulfills the returned promise with the
required module's exports.

    <script>
        (function () {
            var Q = require("promise");
            Q.when(require.async("main"), function (MAIN) {
                ...
            });
        })();
    </script>

The synchronous `require` call may throw an error if you use it without
ensuring that the module you want has been loaded.

    {{env.script.preload(["foo"])|javascript}}
    <script>
        require("bar"); // throws up
    </script>

However, you can make asynchronous require calls without preloading the
corresponding modules.  Missing dependencies will be fetched on demand in a
dynamic, albeit chatty fashion that may not take full advantage of the network
capacity.

    {{env.script.loader()|javascript}}
    <script>
        (function () {
            var Q = require("promise");
            Q.when(require.async("bar"), function (MAIN) {
                ...
            });
        })();
    </script>


Fin
===

Features below this line have not been implemented.


*****

If you want to use modules but are not using a JSGI application
to host them, you will need to use "tusk" to build a module
root.  You will need to do this every time any of your
modules change.

    tusk ...

To load the modules in the browser, use the require script
with the name of the desired root module as the anchor.

    <script src="require.js#main"></script>

Or

    <script src="require.js"></script>
    <script>
        require.load("main");
        require.ready(function () {
            var MAIN = require("main");
        });
    </script>

Or use tusk to generate a script that you can include in
your static HTML.

    tusk ...

Or, if you can't tolerate a build step, and are willing to
host your package tree from origin, you can use the XHR loader.

    <script src="require-xhr.js#main"></script>

