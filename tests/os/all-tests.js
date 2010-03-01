exports.testPopen = require("./popen");
exports.testSystem = require("./system");
exports.testParse = require("./parse")
if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));
