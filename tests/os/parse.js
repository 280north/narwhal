// Richard Penwell (penwellr) MIT Licence - March 1, 2010
var assert = require("test/assert");
var os = require("os");
var io = require("io");

exports.testNoEscapedPaths = function() {
    var result = os.parse('command -option -with other option');
    assert.eq(5, result.length);
    assert.eq("command", result[0]);
    assert.eq("-option", result[1]);
    assert.eq("-with", result[2]);
    assert.eq("other", result[3]);
    assert.eq("option", result[4]);
};

exports.testSlashEscapedPath = function() {
    var result = os.parse('command -path /Volume/path\\ with\\ space/dir');
    assert.eq(3, result.length);
    assert.eq("command", result[0]);
    assert.eq("-path", result[1]);
    assert.eq("/Volume/path with space/dir", result[2]);
};

exports.testSingleQuotedPath = function() {
    var result = os.parse("command -path '/Volume/path with space/dir'");
    assert.eq(3, result.length);
    assert.eq("command", result[0]);
    assert.eq("-path", result[1]);
    assert.eq("/Volume/path with space/dir", result[2]); 
};

exports.testDoubleQuotedPath = function() {
    var result = os.parse('command -path "/Volume/path with space/dir"');
    assert.eq(3, result.length);
    assert.eq("command", result[0]);
    assert.eq("-path", result[1]);
    assert.eq("/Volume/path with space/dir", result[2]);
};

exports.testQuoteInsideQuote = function() {
    var result = os.parse('command -path "/Volume/path with space/dir \'yet more quotes\'"');
    assert.eq(3, result.length);
    assert.eq("command", result[0]);
    assert.eq("-path", result[1]);
    assert.eq("/Volume/path with space/dir 'yet more quotes'", result[2]);
};

exports.testQuotedAndSlashed = function() {
    var result = os.parse('command -path "/Volume/path\\ with\\ space/dir"');
    assert.eq(3, result.length);
    assert.eq("command", result[0]);
    assert.eq("-path", result[1]);
    assert.eq("/Volume/path\\ with\\ space/dir", result[2]);
};

exports.testAllEscapeTypes = function() {
    var result = os.parse('command -path "/Volume/path with space/dir" -I \'/volume/path with space\' -L /volume/libs\\ with\\ space/lib');
    assert.eq(result.length, 7);
    assert.eq("command", result[0]);
    assert.eq("-path", result[1]);
    assert.eq("/Volume/path with space/dir", result[2]); 
    assert.eq("-I", result[3]);
    assert.eq("/volume/path with space", result[4]);
    assert.eq("-L", result[5]);
    assert.eq("/volume/libs with space/lib", result[6]);   
};

if (require.main == module.id)
    os.exit(require("test/runner").run(exports));
