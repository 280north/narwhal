exports.testInflate = require("./inflate-tests");


if (require.main == module)
    require("os").exit(require("test/runner").run(exports));
