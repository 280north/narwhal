
var ASSERT = require("assert");
var FS;

exports.testInitialize = function () {
    FS = require("fs-base");
};

exports.testExists = function () {
    ASSERT.ok(FS.exists(module.path));
};

exports.testIsFile = function () {
    ASSERT.ok(FS.isFile(module.path));
};

exports.testSame = function () {
    ASSERT.ok(FS.same(module.path, module.path));
};

if (require.main == module)
    require("os").exit(require("test").run(exports));

