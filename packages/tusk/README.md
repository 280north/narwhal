
Tusk
====

Tusk is a JavaScript package manager.  It is written entirely in JavaScript and
based on CommonJS API's with few extensions.

Tusk provides a `tusk` command with the following subcommands:

* `install`: downloads and installs a package and its dependencies
* `list`: lists all installed packages
* `update`: downloads the newest package catalog
* `search`: {keyword}, --and, --or, --{key} {value}
* `init`: initializes a Narwhal package/project directory
* `clone`: clones a package from its version control system.
* `catalog`: lists all packages in the catalog

<strong>Note:</strong> on Github, relative links on this page will only work
when viewing this page at the [canonical](tusk/blob/master/README.md) location
of this file.

Creating [packages](docs/package.md) and [catalogs](docs/catalog.md) for Tusk
is simple.  Tusk supports alternate and multiple-catalogs and seamless
independent package installations ([seas](docs/sea.md), similar to Python
virtual environments).

Tusk predates the CommonJS
[Packages/1.0](http://wiki.commonjs.org/wiki/Packages/1.0) specification and
has not yet been updated.


Tusk depends on Tom Robinson's `zipjs` package, the Narwhal Library
`narwhal-lib`, and an HTTP module that supports the Narwhal `http` module's
API.  These are all bundled with Narwhal proper, but can also be provided by
other platforms.

License
-------

Copyright (c) 2009-2010, Kris Kowal

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

