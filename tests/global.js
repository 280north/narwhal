
exports.testArray = require("./global/array");

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

