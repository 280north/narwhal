// Richard Penwell (penwellr) MIT Licence - March 1, 2010

var ASSERT = require("assert");
var OS = require("os");

exports.testNoEscapedPaths = function() {
    var result = OS.parse('command -option -with other option');
    ASSERT.equal(5, result.length);
    ASSERT.equal("command", result[0]);
    ASSERT.equal("-option", result[1]);
    ASSERT.equal("-with", result[2]);
    ASSERT.equal("other", result[3]);
    ASSERT.equal("option", result[4]);
};

exports.testSlashEscapedPath = function() {
    var result = OS.parse('command -path /Volume/path\\ with\\ space/dir');
    ASSERT.equal(3, result.length);
    ASSERT.equal("command", result[0]);
    ASSERT.equal("-path", result[1]);
    ASSERT.equal("/Volume/path with space/dir", result[2]);
};

exports.testSingleQuotedPath = function() {
    var result = OS.parse("command -path '/Volume/path with space/dir'");
    ASSERT.equal(3, result.length);
    ASSERT.equal("command", result[0]);
    ASSERT.equal("-path", result[1]);
    ASSERT.equal("/Volume/path with space/dir", result[2]); 
};

exports.testDoubleQuotedPath = function() {
    var result = OS.parse('command -path "/Volume/path with space/dir"');
    ASSERT.equal(3, result.length);
    ASSERT.equal("command", result[0]);
    ASSERT.equal("-path", result[1]);
    ASSERT.equal("/Volume/path with space/dir", result[2]);
};

exports.testQuoteInsideQuote = function() {
    var result = OS.parse('command -path "/Volume/path with space/dir \'yet more quotes\'"');
    ASSERT.equal(3, result.length);
    ASSERT.equal("command", result[0]);
    ASSERT.equal("-path", result[1]);
    ASSERT.equal("/Volume/path with space/dir 'yet more quotes'", result[2]);
};

exports.testQuotedAndSlashed = function() {
    var result = OS.parse('command -path "/Volume/path\\ with\\ space/dir"');
    ASSERT.equal(3, result.length);
    ASSERT.equal("command", result[0]);
    ASSERT.equal("-path", result[1]);
    ASSERT.equal("/Volume/path\\ with\\ space/dir", result[2]);
};

/* TODO unix sh specific details
exports.testSingleQuoteAndSlash = function () {
    var result = OS.parse("'\\'");
    ASSERT.equal(result.length, 1);
    ASSERT.equal(result[0], '\\');
};

exports.testAdjacentSingleQuotes = function () {
    var result = OS.parse("'a''b'");
    ASSERT.equal(result.length, 1);
    ASSERT.equal(result[0], 'ab');
};

exports.testAdjacentDoubleQuotes = function () {
    var result = OS.parse('"a""b"');
    ASSERT.equal(result.length, 1);
    ASSERT.equal(result[0], 'ab');
};

exports.testAdjacentMixedQuotes = function () {
    var result = OS.parse('"a"\'b\'');
    ASSERT.equal(result.length, 1);
    ASSERT.equal(result[0], 'ab');
};
*/

exports.testAllEscapeTypes = function() {
    var result = OS.parse('command -path "/Volume/path with space/dir" -I \'/volume/path with space\' -L /volume/libs\\ with\\ space/lib');
    ASSERT.equal(result.length, 7);
    ASSERT.equal("command", result[0]);
    ASSERT.equal("-path", result[1]);
    ASSERT.equal("/Volume/path with space/dir", result[2]); 
    ASSERT.equal("-I", result[3]);
    ASSERT.equal("/volume/path with space", result[4]);
    ASSERT.equal("-L", result[5]);
    ASSERT.equal("/volume/libs with space/lib", result[6]);   
};

if (require.main == module.id)
    OS.exit(require("test").run(exports));

