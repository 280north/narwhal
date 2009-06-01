exports.testByteString = require("./bytestring-tests");
exports.testByteArray = require("./bytearray-tests");
exports.testFile = require("./file-tests");
exports.testString = require("./string-tests");
exports.testURI = require("./uri-tests");

require("os").exit(require("test/runner").run(exports));
