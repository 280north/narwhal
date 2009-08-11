
How to make Packages
====================

A package consists of a directory of modules conforming to the ServerJS [Securable Modules](https://wiki.mozilla.org/ServerJS/Modules/SecurableModules) specification, and a "package.json" file in the root of the package containing the location of the modules, depedencies, and other metadata.

A package directory might have the following files and directories:

* "package.json" for package metadata like dependencies and overrides for the conventional directory names.
* "local.json" for overrides on "package.json" provided by the user.
* "bin" for executables.
* "lib" for all object code, including JavaScript modules, and C extensions.
* "src" for all buildable source code, including C and Java source code.
* "jars" for Java class trees and archives.
* "packages/{name}" for installed sub-packages.
* "engines/{engine}" for engine-specific packages.
* "parent" for an inherited package tree, like the "narwhal" package installed by the system administrator or OS package management system.

"package.json" and "local.json" may contain the following attributes:

* "name" - the name of the package.  The package system will only load one package with a given name.  The name defaults to the name of the parent directory.
* "author" - the original author of the package.  The author may be a String including an optional `(` URL in parentheses `)` and optional `<` email address in angle brackets `>`.  Alternately, it may be an Object with any of `name`, `email`, and `url` attributes.  The package reader normalizes authors to the latter Object form.
* "maintainer" - the package maintainer for the project as a String or Object just as the author attribute.
* "contributors" - may be an Array of additional author Strings.
* "url" - the URL of the project website.
* "license" - the name of the license as a String, with an optional URL in parentheses, or an Object with "name" and "url" attributes.
* "description" - a String describing the package.  Most package descriptions end with a period/full stop.
* "keywords" - an Array of String keywords to assist users searching for the package with "tusk search" or "tusk apropos".
* "lib" - a path or array of paths to top-level module directories provided in this package.  Defaults to ["lib"].
* "jars" - for Rhino engines, a path or array of paths to directories to add to the Java CLASSPATH (uses a Java URLClassLoader, so accepts ".jar" paths and directory paths ending with "/").
* "packages" - a path or array of paths to directories containing additional packages, defaults to ["packages"].
* "engines" - a path or array of paths to directories containing engine-specific packages, defaults to ["engines"].  These engine packages will be loaded if and in the prioritized order they appear in the "system.engines" array, and with higher priority that those in this package's generic "js" path so that they can override engine-specific modules.
* "main" - a path to a main program if the package is run with "bin/narwhal" and its directory instead of a specific script.
* "parent" - a path to a package tree to inherit, like the "narwhal" package installed by the system administorator.  Defaults to "parent" if a symlink exists by that name.


