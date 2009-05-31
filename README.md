Narwhal: A flexible server-side JavaScript standard library
===========================================================

Narwhal is a server-side JavaScript standard library conforming to the [ServerJS standard](https://wiki.mozilla.org/ServerJS). It is designed to work with multiple JavaScript interpreters, and to be easy to add support for new interpreters. Wherever possible, it is implemented in pure JavaScript to maximize reuse of code between platforms.


Packages
--------

A package consists of a directory of modules conforming to the ServerJS [Securable Modules](https://wiki.mozilla.org/ServerJS/Modules/SecurableModules) specification, and a "package.json" file in the root of the package containing the location of the modules, depedencies, and other metadata.

A package directory might have the following files and directories:

* "package.json" for package metadata like dependencies and overrides for the conventional directory names.
* "local.json" for overrides on "package.json" provided by the user.
* "bin" for executables.
* "lib" for all object code, including JavaScript modules, and C extensions.
* "src" for all buildable source code, including C and Java source code.
* "jars" for Java class trees and archives.
* "packages/{name}" for installed sub-packages.
* "platforms/{platform}" for platform-specific packages.
* "parent" for an inherited package tree, like the "narwhal" package installed by the system administrator or OS package management system.

"package.json" and "local.json" may contain the following attributes:

* "name" - the name of the package.  The package system will only load one package with a given name.  The name defaults to the name of the parent directory.
* "lib" - a path or array of paths to top-level module directories provided in this package.  Defaults to ["lib"].
* "jars" - for Rhino platforms, a path or array of paths to directories to add to the Java CLASSPATH (uses a Java URLClassLoader, so accepts ".jar" paths and directory paths ending with "/").
* "packages" - a path or array of paths to directories containing additional packages, defaults to ["packages"].
* "platforms" - a path or array of paths to directories containing platform-specific packages, defaults to ["platforms"].  These platform packages will be loaded if and in the prioritized order they appear in the "system.platforms" array, and with higher priority that those in this package's generic "js" path so that they can override platform-specific modules.
* "main" - a path to a main program if the package is run with "bin/narwhal" and its directory instead of a specific script.
* "author" - may be a comment on the package's author and email in angle brackets.
* "contributors" - may be an array of additional author names and email addresses in angle brackets.
* "parent" - a path to a package tree to inherit, like the "narwhal" package installed by the system administorator.  Defaults to "parent" if a symlink exists by that name.


Platforms
---------

We have a template for new platforms at "platforms/template" that you can copy to "platforms/{name}" and fill in the blanks.  These consist of:

1. A shell script at "platforms/{name}/bin/platform-{name}" that executes the interpreter engine of choice and causes it to load a bootstrap script.  This script will be loaded by "bin/narwhal" with NARWHAL_HOME set to the Narwhal project directory.  This script will be run if NARWHAL_PLATFORM is set to your platform name.  You can set NARWHAL_DEFAULT_PLATFORM or NARWHAL_PLATFORM in a "narwhal.conf" in your Narwhal project directory (template provided).

2. A "thunk", at "platforms/{name}/bootstrap.js" that evaluates "narwhal.js" and passes the returned function a preliminary "system" object with a few required properties ("global", "evalGlobal", "platform", "platforms", "print", "evaluate", "prefix", "fs.read", and "fs.isFile").

2. Platform implemenations for core modules, such as "file" and "system" located in "platforms/{name}/lib/".  You can implement "file-platform" instead of "file" if you implement the subset of the ServerJS file API used by "stdlib/file.js".  To get things running, you must implement the file module's "list", "canonical", "mtime", "isDirectory", "isFile".


Available Packages
------------------

* Jack: the webserver and web application/framework agnostic interface, similar to Ruby's Rack and Python's WSGI. Narwhal was concieved while building Jack, and was later extracted into it's own project.

[http://github.com/tlrobinson/jack](http://github.com/tlrobinson/jack)

* Chiron: a system of interoperable JavaScript modules, including a type system, base types, general-purpose functions, events, encoding, decoding, hashing, and caching.

[http://github.com/kriskowal/chiron](http://github.com/kriskowal/chiron)
  
* Nitro: a web application framework built on top of Jack.

[http://github.com/gmosx/nitro](http://github.com/gmosx/nitro)

* getjs: a JavaScript package manager for ServerJS implementations

[http://github.com/dangoor/getjs](http://github.com/dangoor/getjs)

And others including:

* Narcissus
* Wiki Creole
* Browser
* Inspec
* Kupo
* Bespin Server Prototype
* Bespin PubSub


Contributors
------------

* Tom Robinson
* Kris Kowal
* George Moschovitis
* Kevin Dangoor
* Hannes Wallnöfer


License
-------

Copyright (c) 2009 Thomas Robinson <tlrobinson.net>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
