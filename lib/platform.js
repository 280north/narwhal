var implementation = require("platform/platform");

for (var name in implementation)
    exports[name] = implementation[name];

