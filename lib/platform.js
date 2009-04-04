var Platform = require("platform");

for (var name in Platform)
    exports[name] = Platform[name];
