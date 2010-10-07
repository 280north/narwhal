
var assert = require("test/assert");
var util = require("narwhal/util");

/*
exports.testEscape = function () {
};

exports.testEnquote = function () {
};
*/

exports.testExpand = require("./expand");

/*
exports.testTrim = function () {
};

exports.testTrimBegin = function () {
};

exports.testTrimEnd = function () {
};

exports.testPadBegin = function () {
};

exports.testPadEnd = function () {
};
*/

exports.testSqueeze = function () {
    assert.isEqual("http://imperium.gov/",
                   util.squeeze("http://imperium.gov/"));
    assert.isEqual("http:/imperium.gov/",
                   util.squeeze("http://imperium.gov/", "/"));
    assert.isEqual("htp://imperium.gov/",
                   util.squeeze("http://imperium.gov/", "t"));
    assert.isEqual("",
                   util.squeeze(""));
    assert.isEqual(" ",
                   util.squeeze(" ", " "));
    assert.isEqual("o",
                   util.squeeze("ooo", "o"));
};


if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

