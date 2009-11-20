var assert = require("test/assert");

exports.testTextInputStream = require("./textinputstream");


if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));