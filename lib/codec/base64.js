system.log.warn("codec/base64 is deprecated.  use base64 directly.");
var base64 = require("base64");
for (var name in base64) {
    if (Object.prototype.hasOwnProperty.call(base64, name)) {
        exports[name] = base64[name];
    }
}
