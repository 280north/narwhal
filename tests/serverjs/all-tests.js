exports.testFile = require("./file-tests");
exports.testModules = require("./module-tests");
exports.testByteArray = require("./bytearray-tests");
exports.testByteString = require("./bytestring-tests");
exports.testString = require("./string-tests");
exports.testURI = require("./uri-tests");

if (require.main === require.id)
    require("os").exit(require("test/runner").run(exports));
