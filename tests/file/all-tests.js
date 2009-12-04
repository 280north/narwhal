var assert = require("test/assert");
var fs = require("file");

exports.testIsLink = function () {
    
    var here = fs.path(module.path).dirname().join("_test");
    if (here.exists()) {
        here.rmtree();
    }
    here.mkdirs();
    try {
        var dir1 = here.join("dir1");
        dir1.mkdirs();
        var dir2 = here.join("dir2");
        dir2.mkdirs();
        dir2.join("file2").touch();

        dir2.symlink(dir1.join("linkToDir2"));

        assert.isFalse(dir2.isLink());
        assert.isTrue(dir1.join("linkToDir2").isLink());

        dir2.join("file2").symlink(dir1.join("linkToFile1"));

        assert.isFalse(dir2.join("file2").isLink());
        assert.isTrue(dir1.join("linkToFile1").isLink());
    } finally {
        here.rmtree();
    }
}

exports.testRmtreeDoesNotFollowSymlinks = function () {
    var here = fs.path(module.path).dirname().join("_test");
    if (here.exists()) {
        here.rmtree();
    }
    here.mkdirs();
    try {
        var dir1 = here.join("dir1");
        dir1.mkdirs();
        var dir2 = here.join("dir2");
        dir2.mkdirs();
        dir2.symlink(dir1.join("linkToDir2"));
        dir2.join("file2").touch();

        dir1.rmtree();

        assert.isFalse(dir1.exists());
        assert.isTrue(dir2.exists());
        assert.isTrue(dir2.join("file2").exists());
    } finally {
        here.rmtree();
    }
};

exports.testFileFNMatch = require("./fnmatch");
exports.testFileMatch = require("./match");
exports.testFileMatch = require("./glob");

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));
