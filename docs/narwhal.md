
How Narwhal Works
=================

This document provides information on how to use `bin/narwhal`
through its command line options, environment variables,
and configuration files, then descends into the exact
maddenning details of how it goes about bootstrapping
and configuraing itself.


Glossary
--------

*   module: a JavaScript file that gets its own local scope
    and certain free variables so that it may export and import
    APIs.

*   library: a directory that contains additional top-level
    modules.

*   package: a downloadable and installable component that
    may include a library of additional modules, as well
    as executables, source code, or other resources.

*   sandbox: a system of module instances.  sandboxes
    are not necessarily secure in our parlance, but are
    the finest security boundary Narwhal can support.
    All modules in a sandbox are mutually vulnerable to
    each other and to their containing sandbox.  By
    injecting frozen modules into a sandbox, or through
    dependency injection using the `system` variable,
    it will be eventually possible to construct secure
    sandboxes.  In a secure sandbox, monkey patching
    globals will not be possible, and strict mode will
    be enforced.  However, all secure sandboxes will
    be able to share the same primordial objects, particularly
    Array, so managed communication among sandboxes will
    be possible.

*   sea: a sea for Narwhal is like a virtual environment.
    for simplicity, the directory schema of a package, a sea,
    and Narwhal itself are all the same.  They all
    have their own configuration and libraries, but Narwhal
    always starts searching for packages and modules
    in the current sea before searching for packages and
    modules in the main Narwhal installation, or system
    Narwhal installation.


Command Line Options
--------------------

* `-e -c --command COMMAND`

    evaluate command (final option)

* `-r --require MODULE`

    pre-load a module

* `-m --module MAIN`

    run a module as a script (final option)

* `-I --include LIB`

    add a library path to loader in the position of
    highest precedence

* `-p --package PACKAGEPREFIXES`

    add a package prefix directory

* `-d --debug`

     set debug mode, system.debug = true

* `-P --no-packages`

    do not load packages automatically

* `-v --verbose`

    verbose mode: trace 'require' calls.

* `-l --log LEVEL`

     set the log level (critical, error, warn, info, debug)

* `-: --path DELIMITER`

     prints an augmented PATH with all package bins/

* `-V --version`

    print Narwhal version number and exit.


Environment Variables
---------------------

*   `NARWHAL_DEFAULT_PLATFORM` may be set in `narwhal.conf` to a
    platform name like `rhino`, `v8`, or `xulrunner`.  Use
    `tusk platforms` for a complete list and consult the `README` in
    that platform directory for details about its function and
    readiness for use.

*   `NARWHAL_PLATFORM` may be set at the command line, but is
    otherwise set to `NARWHAL_DEFAULT_PLATFORM` by `bin/narwhal`
    and exposed in JavaScript as `system.platform`.  This
    is the name of the JavaScript engine in use.

*   `NARWHAL_HOME` is the path to the `narwhal` directory and
    is available in JavaScript as `system.prefix`.

*   `NARWHAL_PLATFORM_HOME` is the path to the narwhal
    platform directory, where `bootstrap.js` may be found,
    and is set by `bin/narwhal`.

*   `NARWHAL_PATH` and `JS_PATH` can be used to add
    high priority library directories to the module
    search path.  These values are accessible in most
    sandboxes as the `require.loader.paths` variable,
    and may be editable in place with methods like
    `shift`, `unshift`, and `splice`.  Replacing
    `require.loader.paths` with a new Array may not
    have any effect.  In secure sandboxes, `paths`
    are not available.

*   `NARWHAL_DEBUG` is an informational variable that
    can also be set with the `-d` and `--debug` command
    line options, and accessed or changed from within a
    JavaScript module as `system.debug`.  `NARWHAL_DEBUG`
    gets coerced to a `Number`, and the options stack,
    so `js -ddd -e 'print(system.debug)'` will print 3.

*   `NARWHAL_VERBOSE` instructs the module loader
    to report when modules have started and finished
    loading.  This environment variable must be used
    to catalog modules that are loaded in the
    bootstrapping process.  Otherwise, you can use
    the `-v` and `--verbose` options for the same
    effect for modules that are loaded after the
    command line arguments have been parsed, which
    happens before packages are loaded.

*   `SEA` is an environment variable set by `sea` that
    notifies `narwhal` to search the given virtual
    environment for packages first.  This function can
    be approximated by using the `-p` or `--package`
    options to the `narwhal` or `js` command, and is
    inspectable from within a module as the variable
    `system.packagePrefixes[0]`.

*   `SEALVL` (sea level) is an informational environment
    variable provided by the `sea` command, analogous to
    `SHLVL` (shell level) that is the number of instances
    of `sea` the present shell is running in.


Configuration Files
-------------------

*   `narwhal.conf` may be provided to configure site-specific
    or virtual-environment (sea) specific environment
    variables like `NARWHAL_DEFAULT_PLATFORM`.  You can
    also opt to specify `NARWHAL_PLATFORM`, but that obviates
    the possibility of allowing the user to override
    the narwhal platform at the command line.  `narwhal.conf`
    follows the BSD convention of using shell scripts as
    configuration files, so you may use any `bash` syntax
    in this file.  A `narwhal.conf.template` exists for 
    illustration.

*   `package.json` describes the Narwhal package.  Narwhal
    itself is laid out as a package, so it might be used
    as a standard library package for other engines that
    might host module systems independently.  `package.json`
    names the package, its metadata, and its dependencies.
    `package.json` should not be edited.

*   `local.json` may be created to override the values
    provided in `package.json` for site-specific configurations.
    A `local.json.template` exists to illustrate how this
    might be used to tell Narwhal that the parent directory
    contains packages, as this is a common development
    scenario.

*   `sources.json` contains data for Tusk on where to
    find `package.json` files and `package.zip` archives
    so that it can create a catalog of all installable
    packages, their descriptions, and dependencies.
    This file should not be edited unless the intention
    is to update the defaults provided for everyone.

*   `.tusk/sources.json` may be created for site-specific
    package sources and overrides the normal `sources.json`.

*   `catalog.json` is meant to be maintained as a centrally
    managed catalog that may be downloaded from Github to
    `.tusk/catalog.json` using `tusk update`.

*   `.tusk/catalog.json` is where `tusk` looks for information
    about packages that can be downloaded and installed.
    It may be downloaded with `tusk update` or built from
    `sources.json` or `.tusk/sources.json` using
    `tusk create-catalog`.


Bootstrapping Narwhal
---------------------

Narwhal launches in stages.  On UNIX-like systems, Narwhal starts with a `bash` script, a platform specific `bash` script, a platform specific JavaScript, then the common JavaScript.

*   `bin/narwhal`

    At this stage, Narwhal uses only environment variables
    for configuration.  This script discovers its own
    location on the file system and sources `narwhal.conf`
    as a shell script to load any system-level configuration
    variables like `NARWHAL_DEFAULT_PLATFORM`.  From there,
    it discerns and exports the `NARWHAL_PLATFORM` and
    `NARWHAL_PLATFORM_HOME` environment variables.
    It then executes the
    platform-specific script,
    `$NARWHAL_PLATFORM_HOME/bin/narwhal-$NARWHAL_PLATFORM`.

*   `platforms/{platform}/bin/narwhal-{platform}`

    This `bash` script performs some platform-specific
    configuration, like augmenting the Java `CLASSPATH`
    for the Rhino platform, and executes the
    platform-specific bootstrap JavaScript using the
    JavaScript engine for the platform.

    Some platforms, like `k7` require the JavaScript engine
    to be on the `PATH`.  The Rhino platform just expects
    Java to be on the `PATH`, and uses the `js.jar` included
    in the repository.

*   `platforms/{platform}/bootstrap.js`

    This platform-specific JavaScript uses whatever
    minimal mechanisms the JavaScript engine provides
    for reading files and environment variables to
    read and evaluate `narwhal.js`.  `narwhal.js` evaluates
    to a function expression that accepts a zygotic
    `system` `Object`, to be replaced later by loading
    the `system` module proper.  `bootstrap.js` provides a
    `system` object with `global`, `evalGlobal`, `platform`,
    a `platforms` Array, `print`, `fs.read`, `fs.isFile`,
    `prefix`, `packagePrefixes`, and optionally `evaluate`,
    `debug`, or `verbose`.

    *   `global` is the `global` `Object`.  This is
        passed explicitly in anticipation of times
        when it will be much harder to grab this
        object in platforms where its name varies
        (like `window`, or `this`) and where it will
        be unsafe to assume that `this` defaults
        to `global` for functions called anonymously.

    *   `evalGlobal` is a function that calls `eval` in
        a scope where no global variables are masked
        by local variables, but `var` declarations
        are localized.  This is passed explicitly
        in anticipation of situations down the line where
        it will be harder to call `eval` in a pristine
        scope chain.

    *   `platform` is a synonym for the `NARWHAL_PLATFORM`
        environment variable, the name of the platform.
        This variable is informational.

    *   `prefix` is a synonym for the `NARWHAL_HOME`
        environment variable, the path leading to the
        `narwhal` package containing `bin/narwhal`.

    *   `packagePrefixes` is a prioritized Array of all of
        the package directories to search for packages
        when that time comes.  The first package prefix
        should be the `SEA` environment variable, if it 
        exists and has a path.  This is the first place
        that the `packages` module will look for
        packages to load.  The last package prefix is
        simply the `prefix`, `NARWHAL_HOME`.  The `SEA`
        prefix appears first so that virtual environments
        can load their own package versions.

    *   `platforms` is an Array of platform names, used
        to extend the module search path at various stages
        to include platform specific libraries.  There will
        usually be more than one platform in this Array.
        For Rhino, it is `['rhino', 'default']`.  The
        `default` platform contains many "catch-all" modules
        that, while being platform-specific, are also 
        general enough to be shared among almost all
        platforms.  Other platforms are likely to share
        dynamically linked C modules in a "c" platform,
        and the "rhino" platform itself is useful for
        the "helma" platform.

    *   `print` is a temporary shortcut for writing a line to
        a logging console or standard output, favoring
        the latter if it is available.

    *   `fs` is a pimitive duck-type of the `file` module,
        which will be loaded later.  The module loader
        uses `read` and `isFile` to load the initial modules.

    *   `evaluate` is a module evaluator.  If the platform
        does not provide an evaluator, the `sandbox` module
        has a suitable default, but some platforms provide
        their own.  For example, the "secure" platform
        injects a safe, hermetic evaluator.  `evaluate`
        accepts a module as a String, and optionally
        a file name and line number for debugging purposes.
        `evaluate` returns a module factory `Function`
        that accepts `require`, `exports`, `module`, `system`,
        and `print`, the module-specific free variables for
        getting the exported APIs of other modules, providing
        their own exports, reading their meta data, and
        conveniently accessing the `system` module and `print`
        function respectively.

    *   `debug` is informational, may be used anywhere, and
        is read from the `NARWHAL_DEBUG` environment variable,
        and may be set later by the `-d` or `--debug` command
        options.

    *   `verbose` instructs the module loader to log when
        module start and finish loading, and is read
        from the `NARWHAL_VERBOSE` environment variable,
        and may be set later by the `-v` or `--verbose` command
        options.  To log the coming and going of modules
        as they occur **before** the packages and program
        modules get loaded, you must use the environment
        variable.

*   `narwhal.js`

    This is the common script that creates a module loader,
    makes the global scope consistent across platforms,
    finishes the `system` module, parses command line arguments,
    loads packages, executes the desired program, and
    finally calls the unload event for cleanup or running
    a daemon event loop.

When Narwhal is embedded, the recommended practice is to load the `bootstrap.js` platform script directly, skipping the shell script phases.

Some platforms, like Helma or GPSEE, may provide their own module loader implementation.  In that case, they may bypass all of this bootstrapping business and simply include Narwhal as if it were a mere package.

No system has been constructed for Windows systems yet.


Narwhal Script
--------------

The `narwhal.js` script is the next layer of blubber.

*   `sandbox` module (loaded manually from `lib/sandbox.js`),
    provides the means to construct a `require` function
    so all other modules can be loaded.
*   `global` module, monkey patches the transitive globals
    so that every platform receives the same ServerJS
    and EcmaScript 5 global object, or as near to that
    as possible.
*   `system` module, including the `file` and `logger`
    modules, which is provided for convenience as a free
    variable in all modules.
*   `narwhal` module parses arguments.
*   `packages` module loads packages.
    *   `packages-platform` loads jars for Java/Rhino.
*   run command
*   `unload` module sends an `unload` signal to any
    observers, usually for cleanup or to kick off event loops.


Sandbox Module
--------------

The sandbox module provides a basic module `Loader` for
module files on disk, a `MultiLoader` for plugable module
factory loaders (for things like Objective-J modules and
dynamically linked C modules), a `Sandbox` for creating and 
memoizing module instances from the module factories.  The
sandbox module is useful for creating new sandboxes from
within the main sandbox, which is useful for creating cheap
module system reloaders that will instantiate fresh modules but
only go to disk when the underlying module text has changed.


Global Module
-------------

The global module is platform-specific, and there is sharable
version in the default platform.  The purpose of the global
module is to load modules like "json", "string", "array", and
"binary", that monkey patch the globals if necessary to
bring every platform up to speed with EcmaScript 5 and
the ServerJS standard.


System Module
-------------

The system module provides the ServerJS
[System](https://wiki.mozilla.org/ServerJS/System) module
standard, for standard IO streams, arguments, and environment
variables.  The system module goes beyond spec by being
a free variable available in all modules, and by providing
`print`, `fs`, and `log` variables (at the time of this
writing).  `print` is a late-bound alias for
`system.stdout.print`, which is to say that replacing
`system.stdout` will cause `print` to redirect to the new output
stream.  `fs` is an alias for the `file` module, while `log` is a `Logger` instance from the `logger` module that prints time-stamped log messages to `system.stderr`. 


Narwhal Module
--------------

The Narwhal module contains the command line parser declarations
for Narwhal, and an Easter egg.


Packages Module
---------------

The packages module analyzes and installs packages, such that their libraries are available in the module search path, and also installs some platform-specific package components like Java archives at run-time.  The package loader uses a five pass algorithm:

*   find and read package.json for every accessible package,
    collating them into a catalog.  This involves a breadth
    first topological search of the `packages/` directory of each
    `package` in the `system.packagePrefixes` Array.  This
    guarantees that the packages installed in the Sea
    (virtual environment) can override the versions installed
    with the system.
*   verify that the catalog is internally consistent, dropping
    any package that depends on another package that is
    not installed.
*   sort the libraries from packages so that libraries
    that "depend" on other packages get higher precedence
    in the module search path.
*   "analyze" the packages in order.  This involves finding
    the library directories in each package, including
    platform-specific libraries for all of the
    `system.platforms`, and performing platform-specific
    analysis like finding the Java archives (`jars`) installed
    in each package.
*   "synthesize" a configuration from the analysis.  This
    involves setting the module search path, and performing
    platform-specific synthesis, like installing a Java
    class loader for the Java archives, and creating a new,
    global `Packages` object.

Much of the weight of code in the `packages` module concerns 
using both the conventional locations for libraries and whatnot,
but also handling overriden configuration values, gracefully
accepting both single Strings and Arrays of multiple options
for all directories.  For example, `packages` assumes that
each package has a `lib` directory.  However, the package may
provide a `package.json` that states that `lib` has been put
somewhere else, like `{"lib": "lib/js"}`, or even multiple
locations like `{"lib": ["lib/js", "usr/lib/js"]}`.  This 
applies to "packages" and "jars" as well.


Unload Module
-------------

When the program is finished, Narwhal checks whether the
"unload" module has been used.  If so, it calls the "send" 
function exported by that module, so that any observers attached
with the "when" method get called in first on first off order.
This is handy for modules like "reactor" that initiate an event
loop.

