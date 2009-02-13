var Platform = require("{platform}/platform");

for (var name in Platform)
    exports[name] = Platform[name];
