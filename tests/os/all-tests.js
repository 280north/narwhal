exports.testPopen = require("./popen");
exports.testSystem = require("./system");
if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));
