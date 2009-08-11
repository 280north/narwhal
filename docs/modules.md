
Narwhal Modules
===============

Narwhal "scripts" are [ServerJS](https://wiki.mozilla.org/ServerJS) compatible modules, much like Python or Ruby modules.  You do not have to use module pattern boilerplate; every module has its own local scope.  You can get the exports object of another module by calling `require`.

    var file = require("file");
    file.isFile("foo.txt");

Module identifiers for `require` come in three flavors: "top-level", "relative", and "absolute".  In the above case, "file" is a "top-level" identifier, so it will load any module called "file.js" in the "lib" directory of whichever package comes first in the load path.  Relative identifiers have "." or ".." as their first term, and terms are delimited with "/".  So, in the "foo/bar" module, "require('./baz')" will load "foo/baz".  Absolute module identifiers should not be used directly, but are produced when you execute a program module outside the module path.  The module is identified by its fully-qualified path, starting with "/".

You can export an object by assigning it to `exports`.

    exports.foo = function () {
        return "Hello";
    };

In a module, you also get a `module` object that has `module.id` and `module.path` properties so you can inspect your own top-level module identifier, and the path of your own module file.  You also get a `require.main` property that tells you the top-level module identifier of the module that started the program.

    if (require.id == require.main)
        main();

    var settings = require(require.main);

    var fs = require("file");
    var path = fs.path(module.path);
    var indexHtml = path.resolve("./template/index.html").read();

Inside a module, you also get a `print` function and a `system` object.  The `system` object is equivalent to the `system` module, but always available.  It exports `stdin`, `stdout`, `stderr`, `args`, `platform`, `platforms`, `prefix`, and other handy routines.


A Brief Tour
============

The main modules of the standard library are "system", "file", "io", and "os".  There are also handy "json", "args", and "util" modules for a JSON codec, command line argument parsers, and utility functions.

I have already introduced `system`.  The "file" module implements functions like "open", "read", "write", "copy", "move", "list", and others.  "os" exports commands like "system", "command", "exit", "popen", and "enquote" for shell args.

