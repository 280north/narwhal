
exports.testURI = require("./uri");
exports.testQS = require("./query-string");
exports.testHashes = require("./hashes");
exports.testIO = require("./io/all-tests");
exports.testOS = require("./os/all-tests");
exports.testFile = require("./file/all-tests");
exports.testUtil = require("./util/all-tests");
exports.testArgs = require("./args");
exports.testEvents = require("./events");
exports.testHTML = require("./html");

exports.testGlobal = require("./global");

exports.testCommonjs = require("./commonjs/all-tests");

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));

