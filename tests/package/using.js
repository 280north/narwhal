
var ASSERT = require("assert");
var FILE = require("file");
var UTIL = require("util");
var SANDBOX = require("sandbox").Sandbox;


exports.testAll = function() {

    var sandbox = SANDBOX({
        "system": system,
        "loader": require.loader,
        "debug": require.loader.debug,
        "modules": {
            "system": system
        }
    });
    // everything goes through the sandbox from now on
    require = function(id, pkg) {
        return sandbox(id, null, pkg);
    }    
    
    require("global");
    var packages = require("packages");
    packages.load([
        FILE.Path(module.path).dirname().join("_files", "test-sea").valueOf(),
        system.prefix
    ]);

    ASSERT.deepEqual(
        normalizePaths(sandbox.paths),
        [
            "../../packages/readline/engines/rhino/lib",
            "../../packages/readline/engines/default/lib",
            "../../packages/readline/lib",
            "../../engines/rhino/lib",
            "../../engines/default/lib",
            "../../lib",
            "_files/test-sea/lib",
            "_files/test-sea/packages/test-package-1/lib",
            "_files/test-sea/using/domain.com/path/to/package1/lib",
            "_files/test-sea/packages/test-package-2/lib"
        ]
    );

    ASSERT.deepEqual(
        UTIL.keys(packages.catalog),
        [
           "test-sea",
           "test-package-1",
           "test-package-2",
           "domain.com/path/to/package1",
           "narwhal",
           "readline"
        ]
    );

    ASSERT.deepEqual(
        normalizeCatalog(packages.usingCatalog),
        {
            "narwhal": {
              "libPath": "../../lib",
              "directory": "../..",
              "packages": {}
            },
            "readline": {
              "libPath": "../../packages/readline/lib",
              "directory": "../../packages/readline",
              "packages": {}
            },
            "domain.com/path/to/catalog/package2": {
              "libPath": "_files/test-sea/using/domain.com/path/to/catalog/package2/lib",
              "directory": "_files/test-sea/using/domain.com/path/to/catalog/package2",
              "packages": {
                 "my-package-1": "domain.com/path/to/package1"
              }
            },
            "domain.com/path/to/package1": {
              "libPath": "_files/test-sea/using/domain.com/path/to/package1/lib",
              "directory": "_files/test-sea/using/domain.com/path/to/package1",
              "packages": {
                 "my-package-a": "domain.com/path/to/catalog/package2"
              }
            },
            "test-sea": {
              "libPath": "_files/test-sea/lib",
              "directory": "_files/test-sea",
              "packages": {}
            },
            "test-package-1": {
              "libPath": "_files/test-sea/packages/test-package-1/lib",
              "directory": "_files/test-sea/packages/test-package-1",
              "packages": {
                 "my-package-a": "domain.com/path/to/package1",
                 "my-package-b": "domain.com/path/to/catalog/package2"
              }
            },
            "test-package-2": {
              "libPath": "_files/test-sea/packages/test-package-2/lib",
              "directory": "_files/test-sea/packages/test-package-2",
              "packages": {
                 "my-package-a": "domain.com/path/to/catalog/package2",
                 "my-package-b": "domain.com/path/to/package1"
              }
            }
        }
    );

    var main = require("main", "test-sea");
    
    ASSERT.deepEqual(
        main.getInfo(),
        {
           "id": "_files/test-sea/lib/main",
           "path": "_files/test-sea/lib/main.js",
           "package": "test-sea",
           "using": {},
           "subInfo": {
              "id": "_files/test-sea/packages/test-package-1/lib/main",
              "path": "_files/test-sea/packages/test-package-1/lib/main.js",
              "package": "test-package-1",
              "using": {
                 "my-package-a": "domain.com/path/to/package1",
                 "my-package-b": "domain.com/path/to/catalog/package2"
              },
              "subInfo": {
                 "my-package-a": {
                    "id": "_files/test-sea/using/domain.com/path/to/package1/lib/main",
                    "path": "_files/test-sea/using/domain.com/path/to/package1/lib/main.js",
                    "package": "domain.com/path/to/package1",
                    "using": {
                       "my-package-a": "domain.com/path/to/catalog/package2"
                    },
                    "subInfo": {
                       "my-package-a": {
                          "id": "_files/test-sea/using/domain.com/path/to/catalog/package2/lib/main",
                          "path": "_files/test-sea/using/domain.com/path/to/catalog/package2/lib/main.js",
                          "package": "domain.com/path/to/catalog/package2",
                          "using": {
                             "my-package-1": "domain.com/path/to/package1"
                          },
                          "subInfo": {
                             "my-package-1": "RECURSION"
                          }
                       }
                    }
                 },
                 "my-package-b": "RECURSION"
              }
           }
        }
    )
}

function normalizePaths(pathsIn) {
    var paths = [];
    UTIL.forEach(pathsIn, function(path) {
        paths.push(FILE.Path(module.path).relative(path).valueOf());
    });
    return paths;
}

function normalizeCatalog(catalogIn) {
    var catalog = {}
    for( var id in catalogIn ) {
        catalog[id] = UTIL.copy(catalogIn[id]);
        catalog[id].libPath = FILE.Path(module.path).relative(catalog[id].libPath).valueOf();
        catalog[id].directory = FILE.Path(module.path).relative(catalog[id].directory).valueOf();
    }
    return catalog;
}

if (require.main == module.id)
    require("os").exit(require("test").run(exports));

