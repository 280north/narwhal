
var util = require('narwhal/util');
var args = require('narwhal/args');
var assert = require('test/assert');

// subclass Parser to prevent it from assertively
// exiting the test suite
var Parser = exports.Parser = function () {
    args.Parser.apply(this, arguments);
};
Parser.prototype = Object.create(args.Parser.prototype);
Parser.prototype.constructor = Parser;
Parser.prototype.exit = function () {
    throw new Exit();
};
Parser.prototype.print = function () {
    if (system.debug)
        args.Parser.prototype.print.apply(this, arguments);
};
var Exit = exports.Exit = function () {
    Error.apply(this, arguments);
};
Exit.prototype = Object.create(Error.prototype);

exports.testOptions = require("./args/options");
exports.testDomain = require("./args/domain");
exports.testShifting = require("./args/shifting");
exports.testChoices = require("./args/choices");
exports.testActions = require("./args/actions");
exports.testCommands = require("./args/commands");

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

