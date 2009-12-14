var args = require('args');
var assert = require("test/assert");
var test = require("../args");

exports.testBasis = function () {
    var parser = new test.Parser();
    var options = parser.parse([]);
    assert.eq(["args"], Object.keys(options));
};

exports.testShortOptionSetUnnamed = function () {
    var parser = new test.Parser();
    parser.option('-o').set();
    var options = parser.parse(['c', '-o', 'a']);
    assert.eq("a", options.o);
    assert.eq(["args", "command", "o"], Object.keys(options));
};

exports.testLongOptionSetUnnamed = function () {
    var parser = new test.Parser();
    parser.option('-o', '--option').set();
    var options = parser.parse(['c', '--option', 'a']);
    assert.eq("a", options.option);
    assert.eq(["args", "command", "option"], Object.keys(options));
};

exports.testLongOptionSet = function () {
    var parser = new test.Parser();
    parser.option('-o', '--option', 'option').set();
    var options = parser.parse(['c', '--option', 'a']);
    assert.eq("a", options.option);
    assert.eq(["args", "command", "option"], Object.keys(options));
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
