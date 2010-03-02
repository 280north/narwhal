
When you require a module the first time, Narwhal constructs a function from
the text of the module and executes it with three named arguments:

* `require`
* `exports`
* `module`

Narwhal memoizes the exports object before it calls the "module factory
function" so it gets returned immediately if your module gets required by one
of its deep dependencies.  The exports object is what `require` returns.  It
also guarantees that, in a single system of modules, the module factory
function only gets called once.  However, Narwhal also exposes all of the
machinery it uses to load and execute modules so you can:

- create a new system of modules, a "sandbox",
- create new module loaders,
- share a module loader with any number of sandboxes to cut down on time wasted
  parsing modules repeatedly,
- execute a module factory function with any named arguments at any time,
- execute a module factory function with a one-time-use `exports` object, `require`
  function and, `module` object with any additional free variables.

Making a module subsystem is great for test scaffolding and eventually will be
useful for partitioning secure subsystems and injecting dependencies into that
system.  Narwhal's module system's own testing scaffold uses this feature.

Calling a module with additional free variables is great for constructing
domain specific languages. `Jakefile`, `QUnit`, or `Bogart` would be great
use-cases for this feature.

To get a module factory function, call `require.load(id)`.  The module factory
function takes one argument: an object that owns the named free variables to
inject into the module's lexical scope.

`foo.js`:

    return a + b;

`bar.js`:

    require.load("foo")({a: 10, b: 20}) === 30

When you use "load", the module gets exactly the free variables you have
given it.  If you want `require`, `exports`, and `module` to exist in that
scope, you must either inject them manually (which is somewhat involved),
or you can use the `require.once(id, scope)` convenience function.

`qux.js`:

    var ASSERT = require("assert");
    ASSERT.equal(a + b, 30);

`quux.js`:

    require.once("qux", {a: 20, b: 10});

Future topics:

* `require("sandbox")`
* `require("loader")`
* `load`
* `require.loader`
* `require.loader.resolve(id, baseId)`
* `require.loader.find`
* `require.paths`
* `require.loader.loaders`

