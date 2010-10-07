var assert = require("test/assert");
var util = require("narwhal/util");

var uri = require("uri");
var URI = uri.URI;

exports.testConstructor = function() {
    var uri = new URI("http://www.narwhaljs.org/blog/categories?id=news");

    assert.isEqual("http", uri.scheme);
    assert.isEqual("www.narwhaljs.org", uri.authority);
    assert.isEqual("/blog/categories", uri.path);
    assert.isEqual("id=news", uri.query);
    assert.isNull(uri.fragment);
}

exports.testToString = function() {
    var uri = new URI("http://www.narwhaljs.org/blog/categories?id=news");
    assert.isEqual("http://www.narwhaljs.org/blog/categories?id=news", uri.toString());
}

util.forEachApply([
    ["/foo/bar/baz", "/foo/bar/quux", "quux"],
    ["/foo/bar/baz", "/foo/bar/quux/asdf", "quux/asdf"],
    ["/foo/bar/baz", "/foo/bar/quux/baz", "quux/baz"],
    ["/foo/bar/baz", "/foo/quux/baz", "../quux/baz"]
], function (from, to, expected) {
    exports[
        'testRelative ' +
        'from: ' + util.repr(from) + ' ' +
        'to: ' + util.repr(to) + ' ' +
        'is: ' + util.repr(expected)
    ] = function () {
        var actual = uri.relative(from, to);
        assert.eq(expected, actual);
    };
});

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

