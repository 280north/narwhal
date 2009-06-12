exports.testFile = require("./file-tests");
exports.testModules = require("./module-tests");
exports.testByteArray = require("./bytearray-tests");
exports.testByteString = require("./bytestring-tests");

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
