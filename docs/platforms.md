
Platforms
=========

Narwhal is a standard library and tools for multiple JavaScript engines; each engine has its own "platform" library.  Use `tusk platform {name}` to select an engine, or edit `narwhal.conf`.  The following engines are presently in development:

* `rhino`: is the default and most complete platform, based on Mozilla Rhino for Java, used for out-of-the-box functionality.
* `k7`: is a `v8` based engine, in development by Sébastien Pierre.
* `helma`: is based on Rhino with extensions, being developed by Hannes Wallnöefer.
* `xulrunner`: is in development for Firefox extensions and XULRunner applications on the Spidermonkey platform by Irakli Gozalishvili, Christoph Dorn, and Zach Carter.
* `jaxer`: is an engine based on Mozilla SpiderMonkey, for deploying web pages with both server and client side scripts, being developed by Nathan L Smith.
* `v8cgi`: is based on the work of Ondrej Zara, and has not been updated in a long while.
* `default`: is a catchall platform that implements modules that can be shared among platforms.
* `browser`: will eventually be available for client side loading of modules with various techniques.
* `secure`: will eventually be available for dependency injection sandboxed module systems within some other platforms.


Creating new Platform Adapters
------------------------------

We have a template for new platforms at "platforms/template" that you can copy to "platforms/{name}" and fill in the blanks.  These consist of:

1. An executable (shell script or binary) at "platforms/{name}/bin/platform-{name}" that executes the interpreter engine of choice and causes it to load a bootstrap script.  This script will be loaded by "bin/narwhal" with the environment variable `NARWHAL_HOME` set to the Narwhal project directory and `NARWHAL_PLATFORM_HOME` set to the platform directory.  This script will be run if `NARWHAL_PLATFORM` is set to your platform name.  You can set `NARWHAL_DEFAULT_PLATFORM` or `NARWHAL_PLATFORM` in a "narwhal.conf" in your Narwhal project directory (template provided).

2. A "thunk", at `platforms/{name}/bootstrap.js` that evaluates `narwhal.js` and passes the returned function a preliminary `system` object with a few required properties (`global`, `evalGlobal`, `platform`, `platforms`, `print`, `evaluate`, `prefix`, `fs.read`, and `fs.isFile`). This should be enough to get to an interactive console.

3. Platform implementations for core modules, such as `file` and `system` located in `platforms/{name}/lib/`.  You can implement `file-platform` instead of `file` if you implement the subset of the ServerJS file API used by `lib/file.js` (and similar for `io`, `os`, `binary`, etc). The next steps are:

    * system: You must implement `system.args` to be able to pass command line options to Narwhal.

    * file: To enable the package system you must implement `list`, `canonical`, `mtime`, `isDirectory`, `isFile`.

