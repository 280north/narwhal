exports.testCommonjs = require("./commonjs/all-tests");
if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));
