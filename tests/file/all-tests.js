var assert = require("test/assert");
var fs = require("file");

exports.testRmtreeDoesNotFollowSymlinks = function () {
    var here = fs.path(module.path).dirname();
    if (here.join('foo').exists())
        here.join('foo').rmtree();
    try {
        here.join('foo', 'bar').mkdirs();
        here.join('foo', 'bar').symlink(here.join('foo', 'baz'));
        here.join('foo', 'baz').rmtree();
        assert.isTrue(here.join('foo', 'bar').exists());
    } finally {
        here.join('foo').rmtree();
    }
};

exports.testGlobStar = function () {
};

exports.testGlobQuestion = function () {
};

exports.testGlobStarStar = function () {
};

exports.testGlobDotDotDot = function () {
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
