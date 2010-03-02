---
layout: default
title: "packages using"
---

Narwhal Packages
================

Narwhal supports two types of packages:

  * `system` packages that get placed onto the system namespace (`require.paths`) for the purpose of loading system
    modules where modules are loaded based on path only irrespective of the package the module is in.
    
  * `using` packages that are defined on a `package` level and allow loading of specific modules from specific packages.


Using Packages
--------------

When building programs it makes sense to separate different types of modules into packages. These packages may
be tied (dependent on) to each other and to a program package. A dependency on another package is declared in
the `package.json` file of a package:

    {
        "using": {
            "<package-alias>": {        // A package descriptor
                "location": "<url>",
                "path": "<path>"        // Optional
            }
        }
    }

where `<package-alias>` is a package-local name used to identify the `using` package when loading modules:

    require('<module>', '<package-alias>');
    
and `<url>` is a URL pointing to the root of the `using` package:

    http://domain.com/path/to/package/         // Pointing to a zip archive
    file://path/to/package/                    // Pointing to the package root
    http://domain.com/path/to/package.zip      // Planned - NYI

and `<path>` is an optional path to the root of the package from the end of the URL. This is useful to reference
packages in archives where the package is not at the root of the archive.

The indirection via `<package-alias>` allows loading of different versions of the same module.

Narwhal itself does not manage packages (that is `tusk`'s job) but one important design goal was to provide
`using` package support without the need for a package manager. To that end the package descriptor is used to
map the `<url>` to a filesystem path:

    <sea>/using/<url-domain>/<url-path>/<path>/
    
where `<sea>` is the path to the sea (program) package, `<url-domain>` is the domain part of the `<url>`, `<url-path>` is
the path part of the `<url>` and `<path>` is from the package descriptor. `<url>` example from above:

    <sea>/using/domain.com/path/to/package/
    <sea>/using/path/to/package/
    <sea>/using/domain.com/path/to/package/    // Planned - NYI

As mentioned `tusk` will automate the package management but until that functionality is ready you can manually:

  * Define package descriptors with URLs to github for example (http://github.com/cadorn/domplate/zipball/master/)
  * Manually download the package archive or clone the package repository
  * Copy or link the package root to the corresponding <sea>/using/ path
  
  
Cataloged Using Packages
------------------------

A second type of package descriptors is supported where packages are referenced via catalogs:

    {
        "using": {
            "<package-alias>": {
                "catalog": "<url>",
                "name": "<name>"
            }
        }
    }

where `<url>` is a URL pointing to a `catalog.json` file and `<name>` is the name of the package within the catalog.
A catalog package descriptor gets mapped as follows:

    <sea>/using/<url-domain>/<url-path>/<name>/

where `<url-path>` is the *dirname* of the path (no catalog.json). The content of the `catalog.json` file is irrelevant
for the purpose of loading modules. Only package managers such as `tusk` need to work with catalog.json files.

For example:

    {"catalog": "http://domain.com/path/to/catalog.json", "name": "package1"}
    
maps to:

    <sea>/using/domain.com/path/to/package1/


Requiring Modules
-----------------

When loading modules the `require()` function has the following behaviour:

    require('<module>')

Loads `<module>` from `require.paths`.

    require('./<module>')
    
Loads `<module>` relative to the calling module.

    require('<module>', '<package-alias>')
    
Loads `<module>` from the `<package-alias>` package.


Notes
-----

  * By default all packages in `<sea>/packages` get loaded onto the system path (`require.paths`). This is a problem if
    a package should only be used as a `using` package vs a `system` package. To declare that a package is to be used
    as a `using` package only (and restrict it from being loaded onto `require.paths`) the `type` property in `package.json`
    may be set to `using`. i.e.
      {
          "type": "using"
      }

  