
var args = require('args');
var assert = require("test/assert");
var test = require("../args");

function Parser() {
    var parser = new test.Parser();
    parser.option('-s', '--set').set();
    parser.option('-f', '--flag').set(true);
    parser.option('-2', '--two')
        .action(function (options, name, a, b) {
            options[name] = [a, b];
        });
    return parser;
};

exports.testSetShort = function () {
    var parser = Parser();
    var options = parser.parse(['command', '-s', 'value']);
    assert.eq('value', options.set);
    assert.eq([], options.args);
};

exports.testSetShortMerged = function () {
    var parser = Parser();
    var options = parser.parse(['command', '-svalue']);
    assert.eq('value', options.set);
    assert.eq([], options.args);
};

exports.testFlagSetShortMerged = function () {
    var parser = Parser();
    var options = parser.parse(['command', '-fsvalue']);
    assert.eq(true, options.flag);
    assert.eq('value', options.set);
    assert.eq([], options.args);
};

exports.testFlagSetShortMergedRemainder = function () {
    var parser = Parser();
    var options = parser.parse(['command', '-fsvalue', 'hi']);
    assert.eq('command', options.command);
    assert.eq(true, options.flag);
    assert.eq('value', options.set);
    assert.eq(['hi'], options.args);
};

exports.testTwoShort = function () {
    var parser = Parser();
    var options = parser.parse(['command', '-2', 'a', 'b', 'c']);
    assert.eq(['a', 'b'], options.two);
    assert.eq(['c'], options.args);
};

exports.testTwoShortMerged = function () {
    var parser = Parser();
    var options = parser.parse(['command', '-2a', 'b', 'c']);
    assert.eq(['a', 'b'], options.two);
    assert.eq(['c'], options.args);
};

exports.testSetLong = function () {
    var parser = Parser();
    var options = parser.parse(['command', '--set', 'value']);
    assert.eq('value', options.set);
    assert.eq([], options.args);
};

exports.testSetLongMerged = function () {
    var parser = Parser();
    var options = parser.parse(['command', '--set=value']);
    assert.eq('value', options.set);
    assert.eq([], options.args);
};

exports.testHaltOptions = function () {
    var parser = Parser();
    var options = parser.parse(['command', '--', '-svalue']);
    assert.eq(undefined, options.set);
    assert.eq(['-svalue'], options.args);
};

exports.testNoSuchOption = function () {
    var parser = Parser();
    assert.throwsError(function () {
        parser.parse(['command', '--no-such-option']);
    }, test.Exit)
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

