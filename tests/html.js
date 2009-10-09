var assert = require("test/assert");

var html = require("nitro/utils/html"),
    escapeHTML = html.escapeHTML,
    stripTags = html.stripTags;

exports.testEscapeHTML = function() {
    var str = '<p class="text">hello</p>';
    assert.isEqual(escapeHTML(str), '&lt;p class="text"&gt;hello&lt;/p&gt;');
}

exports.testStripTags = function() {
}
