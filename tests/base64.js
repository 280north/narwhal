
var base64 = require('base64.js');
var binary = require('binary');
var assert = require('test/assert.js');

exports.test = function () {
    var raw = "Once upon a time, in a far away land.\n";
    var encoded = 'T25jZSB1cG9uIGEgdGltZSwgaW4gYSBmYXIgYXdheSBsYW5kLgo=';

    assert.eq(base64.encode(raw), encoded, 'encoded');
    assert.eq(base64.decode(encoded), raw, 'decoded');
    assert.eq(base64.decode(base64.encode(raw)), raw, 'encode decode identity');
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

