
var util = require("narwhal/util");
var args = require("narwhal/args");
var assert = require('test/assert');
var test = require('../args');

exports.testValidateMultiple = function () {
    var parser = new test.Parser();
    parser.option('-o')
        .action(function (options, name, value) {
        })
        .validate(function (value) {
        })
};

exports.testValidatorChain = function () {
    var parser = new test.Parser();
    parser.option('-o')
        .action(function (options, name, value) {
        })
        .validate(function (value) {
            return value;
        })
        .validate(function (value) {
            return value;
        })
};

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

