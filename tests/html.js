// -- gmosx George Moschovitis Copyright (C) 2009-2010 MIT License

var assert = require("test/assert"),
    HTML = require("html");

exports.testEscape = function () {
    var str = '<p class="text">hello</p>';
    assert.isEqual(HTML.escape(str), '&lt;p class="text"&gt;hello&lt;/p&gt;');
}

exports.testUnescape = function () {
    var str = '&lt;p class="text"&gt;hello&lt;/p&gt;';
    assert.isEqual(HTML.unescape(str), '<p class="text">hello</p>');
}

exports.testStripTags = function () {
    var str = '<span>hello <b>user</b></span>';
    assert.isEqual(HTML.stripTags(str), 'hello user');
}
