exports.testModules = require("./modules/all-tests");
exports.testModulesUTF8 = require("./module-tests");
exports.testAssert = require("./assert");
exports.testByteArray = require("./bytearray-tests");
exports.testByteString = require("./bytestring-tests");
exports.testByteArrayEncodings = require("./bytearray-encodings-tests");
exports.testByteStringEncodings = require("./bytestring-encodings-tests");
exports.testFile = require("./file-tests");
exports.testEs5 = require("./es5/all-tests");

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));
