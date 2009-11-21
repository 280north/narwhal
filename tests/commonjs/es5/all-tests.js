exports.testFunctionBind = require("./bind");
if (require.main == module)
    require("os").exit(require("test").run(exports));
