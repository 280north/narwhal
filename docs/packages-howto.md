
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


