exports.testFunctionBind = require("./bind");
if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
