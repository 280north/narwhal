var assert = require("test/assert");

var URI = require("uri").URI;

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
