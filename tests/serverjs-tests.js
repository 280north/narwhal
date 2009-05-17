exports.testByteString = require("./bytestring-tests");
exports.testByteArray = require("./bytearray-tests");
exports.testFile = require("./file-tests");

require("test/runner").run(exports);
