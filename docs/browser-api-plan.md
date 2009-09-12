
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

These options haven't been implemented yet:

 * `path`: overrides the path used for server-hosted modules.
   For example, "javascript/" instead of the default, ".js/".
   This is intended to avoid collisions with existing services
   down the routing cascade.
 * `proxy`: Alternate URL to search for scripts.
 * `catalog`: Alternate URL's for indivudal scripts or
   script bundles.

This introduces an API to the "env" for all subsequent
poritions of the request route.  The first form loads a module
and its transitive dependencies:

    env.script.require(id)

The second form aynchronously loads the given modules and
their transitive dependencies, but does not invoke any
of them.

    env.script.preload([id...])

These functions return unescaped JavaScript text
suitable for inserting in an HTML `<script>` tag.  The intent
is for you to use these functions through whatever template
formatting system your site uses, as in this speculative
example:

    <script>{{env.script.require("main")|javascript}}</script>

Or, with a higher level API that could be implemented to look like:

    {% script.require "main" %}

If you intend to use modules in inline scripts, you will need
to wait for the desired modules to load before you execute
your code.

    {% script.preload "main" %}
    <script>
        require.when("main", function () {
            var MAIN = require("main");
            ...
        });
    </script>

This is a shortcut for attaching a fullfilment handler to a
promise.

    {% script.preload "main" %}
    <script>
        var Q = require("promise");
        Q.when(require.async("main"), function () {
            var MAIN = require("main");
            ...
        });
    </script>


Fin
===

Only features documented before this line have been
implemented.


*****

In a browser, calling "require" directly will throw an
error since it cannot guarantee that the modules have
loaded before the function returns.

    <script>
        require("main"); // throws require.Error
    </script>

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

