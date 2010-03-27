
Catalogs and Sources
====================

Tusk uses a "consolidated" catalog, usually at "`$SEA/.tusk/catalog.json`" to
find and install packages.  The catalog is generated on demand (on first
attempt to use "`tusk install`") or when you expressly run "`tusk update`".
The default catalog is downloaded from the Narwhal project.  You can create
your own catalog by making a "`$SEA/.tusk/sources.json`" source catalog and
consolidating it by running "`tusk update`".

Multiple Catalogs
-----------------

You can create a catalog from multiple catalogs with the `"includes"` property
in your "`sources.json`".

    {"includes": [
        "http://example.com/catalog.json",
        "file:///usr/share/narwhal/catalog.json",
        "../extra-sources.json"
    ]}

The catalogs can have transitive dependencies.  They are prioritized from
lowest to highest, so the last catalog will override the package descriptors
of all the catalogs that come before it.

Package Sources
---------------

A package may also specify its own package sources, like Github projects or zip
archives anywhere on the Web.

    {
        "includes": ["catalog.json"],
        "sources": {
            "my-project": {
                "type": "github",
                "user": "me",
                "name": "my-github-project-name" // defaults to "my-project"
                "ref": "1.0" // defaults to "master"
            }
        }
    }

Catalog Generation
------------------

`tusk udpate` generates the consolidated catalog ("`$SEA/.tusk/catalog.json`",
from the catalog sources ("`$SEA/.tusk/sources.json`").  You can use Tusk to
create catalogs for publication on the web, so your users can include them
in their projects.  It would work fine to post your raw sources.  However,
all of your users would then have to construct their catalogs with numerous
HTTP requests to the original projects.  To avoid that, or to create catalogs
that use stable versions of each of those projects, Tusk can consolidate
sources.

Tusk takes optional input and output catalogs.  To consolidate "`sources.json`"
into "`catalog.json`", use the following command:

    $ tusk update -i sources.json -o catalog.json

The input and output default to their corresponding files in ("`$SEA/.tusk`")
so you can provide either, neither, or both.

Tusk can also be asked to update specific package descriptors from their
sources in a consolidated catalog.

    $ tusk update narwhal

Consult "`tusk update --help`" for further options.

Schemas
=======

Catalogs and Sources
--------------------

For example, "`sources.json`" and "`catalog.json`"

 * `!` a comment
 * `version` a schema number.  if this is less than the minimum schema version
   supported by the package manager, the package manager must update its
   catalog, and will do so automatically
 * `includes` array of URLs to catalogs to include, from lowest to highest
   priority, all lower priority than this one catalog
 * `sources` object mapping package names to package descriptor sources
   (described below)
 * `packages` object mapping package names to package descriptors (described
   below)

Package Descriptors
-------------------

For example, "`package.json`".

 * `name` the name of the package.  The package system will only load one
   package with a given name.  The name defaults to the name of the parent
   directory.
 * `author` the original author of the package.  The author may be a String
   including an optional `(` URL in parentheses `)` and optional `<` email
   address in angle brackets `>`.  Alternately, it may be an Object with any of
   `name`, `email`, and `url` attributes.  The package reader normalizes
   authors to the latter Object form.
 * `maintainer` the package maintainer for the project as a String or Object
   just as the author attribute.
 * `contributors` may be an Array of additional author Strings.
 * `url` the URL of the project website.
 * `license` the name of the license as a String, with an optional URL in
   parentheses, or an Object with `name` and `url` attributes.
 * `description` a String describing the package.  Most package descriptions
   end with a period/full stop.
 * `keywords` an Array of String keywords to assist users searching for the
   package with `tusk search` or `tusk apropos`.
 * `lib` a path or array of paths to top-level module directories provided in
   this package.  Defaults to `["lib"]`.
 * `jars` for Rhino engines, a path or array of paths to directories to add
   to the Java CLASSPATH (uses a Java URLClassLoader, so accepts `.jar` paths
   and directory paths ending with `/`).
 * `packages` a path or array of paths to directories containing additional
   packages, defaults to `["packages"]`.
 * `engines` a path or array of paths to directories containing
   engine-specific packages, defaults to `["engines"]`.  These engine packages
   will be loaded if and in the prioritized order they appear in the
   `system.engines` array, and with higher priority that those in this
   package's generic `js` path so that they can override engine-specific
   modules.
 * `version` a version string, array, or object, normalized to an object
 * `async` boolean whether this package exclusively provides and consume
   asynchronous APIs.
 * `packageUrl` the URL of the archive of this package.  This property does not
   need to be included in a package's advertised package.json if the package
   manager can discern it from the catalog's sources package descriptor
   reference.
 * `packageArchive` optionally, the archival medium of the package, defaults to
   `"zip"`, and no other media are yet supported.
 * `source` the source Object from which this package was generated, if any.

Package Descriptor Source
-------------------------

 * `type` either `"github"` or `"inline"`

Additional properties depend on the type and are described below.

Github Package Descriptor Source
--------------------------------

 * `type` `"github"`
 * `user` a Github user name
 * `name` an optional Github project name, defaults to the package name
 * `ref` an optional Github ref: branch, tag, or commit hash; that defaults to
   `"master"`
 * `descriptor` an optional package descriptor if the Github project does not
   contain one, or must be overridden.  Providing a `descriptor` prevents
   "`tusk update`" from attempting to download "`package.json`" from the
   project.

Inline Package Descriptor Source
--------------------------------

 * `type` `"inline"`
 * `descriptor` a package descriptor that must include a `packageUrl`.
 * `descriptorUrl` the URL of a `package.json` package descriptor file, if no
   descriptor is expressly provided.

