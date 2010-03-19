
Seas
====

A sea is a collection of installed packages managed by Tusk.  When a
sea is "active", all JavaScript commands use the packages in that sea,
and Tusk manages the activated sea.  The base of the sea has a `.tusk`
directory which contains configuration information and caches.  The
only important file is the catalog, a `catalog.json` file that Tusk
writes when `tusk update` runs.  The updater downloads the cananonical
Narwhal catalog by default.  If you provide your own `sources.json`,
the Tusk updater uses that instead.  `sources.json` and `catalog.json`
are the same format, and can reference multiple catalogs either
locally or on the web.  The update command reduces the `sources.json`
to `catalog.json` which contains one consistent snapshot of the entire
package ecosystem.  So, review the information about
[catalogs](catalog.md) for how to format `sources.json`.

The files in `.tusk` presently include:

* `catalog.json`
* `sources.json`
* `notes.json` includes information about what packages were
  installed, which can be safely removed when other packages
  no longer depend on them, and what files they wrote.
* `http` is an HTTP cache managed by the `narwhal-lib`
  http/store` module.  This can be safely deleted at any time.

