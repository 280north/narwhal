
var util = require('util');
var args = require('args');
var assert = require('test/assert');
var test = require('../args');

exports.testCommand = function () {
    var parser = new test.Parser();
    var options = parser.parse(['command']);
    assert.eq('command', options.command);
};

exports.testNoOptionNameError = function () {
    var parser = new test.Parser();
    assert.throwsError(function () {
        parser.option();
    }, args.ConfigurationError);
};

exports.testOptionNameShort = function () {
    var parser = new test.Parser();
    var option = parser.option('-o');
    assert.eq('o', option.getName());
};

exports.testOptionNameLong = function () {
    var parser = new test.Parser();
    var option = parser.option('-o', '--option');
    assert.eq('option', option.getName());
};

exports.testOptionNameDisplay = function () {
    var parser = new test.Parser();
    var option = parser.option('-o', 'option');
    assert.eq('option', option.getName());
};

exports.testOptionSet = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').set();
    var options = parser.parse(['command', '-o', 'value']);
    assert.eq('command', options.command);
    assert.eq('value', options.o);
    assert.eq([], options.args);
};

exports.testOptionSetNotEnoughArgs = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').set();
    assert.throwsError(function () {
        parser.parse(['command', '-o']);
    });
};

exports.testOptionSetTrue = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').set(true);
    var options = parser.parse(['command', '-o']);
    assert.eq('command', options.command);
    assert.eq(true, options.o);
    assert.eq([], options.args);
};

exports.testOptionNumber = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').number();
    var options = parser.parse(['command', '-o', '1.1']);
    assert.eq(1.1, options.o);
    var options = parser.parse(['command', '-o', '-1.1']);
    assert.eq(-1.1, options.o);
};

exports.testOptionNumberError = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').number();
    assert.throwsError(function () {
        var options = parser.parse(['command', '-o', 'TEXT']);
    }, test.Exit);
};

exports.testOptionInteger = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').integer();
    var options = parser.parse(['command', '-o', '1']);
    assert.eq(1, options.o);
    var options = parser.parse(['command', '-o', '-1']);
    assert.eq(-1, options.o);
};

exports.testOptionIntegerDomainRationalError = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').integer();
    assert.throwsError(function () {
        var options = parser.parse(['command', '-o', '1.1']);
    }, test.Exit);
};

exports.testOptionIntegerDomainParseError = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').integer();
    assert.throwsError(function () {
        var options = parser.parse(['command', '-o', 'TEXT']);
    }, test.Exit);
};

exports.testOptionNatural = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').natural();
    var options = parser.parse(['command', '-o', '1']);
    assert.eq(1, options.o);
};

exports.testOptionNaturalDomainPositiveError = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').natural();
    assert.throwsError(function () {
        var options = parser.parse(['command', '-o', '-1']);
    }, test.Exit);
};

exports.testOptionNaturalDomainRationalError = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').natural();
    assert.throwsError(function () {
        var options = parser.parse(['command', '-o', '1.1']);
    }, test.Exit);
};

exports.testOptionNaturalParseError = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').natural();
    assert.throwsError(function () {
        var options = parser.parse(['command', '-o', 'TEXT']);
    }, test.Exit);
};

exports.testOptionOct = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').oct();
    var options = parser.parse(['command', '-o', '755']);
    assert.eq(0755, options.o);
};

exports.testOptionOctError = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').oct();
    assert.throwsError(function () {
        var options = parser.parse(['command', '-o', 'TEXT']);
    }, test.Exit);
};

exports.testOptionHex = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').hex();
    var options = parser.parse(['command', '-o', 'ff']);
    assert.eq(0xFF, options.o);
};

exports.testOptionHexError = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').hex();
    assert.throwsError(function () {
        var options = parser.parse(['command', '-o', 'TEXT']);
    }, test.Exit);
};

exports.testOptionNatural = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').natural();
    var options = parser.parse(['command', '-o', '1']);
    assert.eq(1, options.o);
};

exports.testOptionNaturalDomainError = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').natural();
    assert.throwsError(function () {
        parser.parse(['command', '-o', '-1']);
    });
};

exports.testOptionNaturalParseError = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').natural();
    assert.throwsError(function () {
        parser.parse(['command', '-o', 'TEST']);
    });
};

exports.testOptionWhole = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').whole();
    var options = parser.parse(['command', '-o', '1']);
    assert.eq(1, options.o);
};

exports.testOptionWholeDomainError = function () {
    var parser = new test.Parser();
    var option = parser.option('-o').whole();
    assert.throwsError(function () {
        parser.parse(['command', '-o', '0']);
    }, Error);
};

exports.testNoActionForOptionError = function () {
    var parser = new test.Parser();
    parser.option('-o');
    assert.throwsError(function () {
        parser.parse(['command', '-o']);
    }, args.ConfigurationError);
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

