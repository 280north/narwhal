
var assert = require("test/assert");
var util = require('util');
var format = require("printf");
var sandboxing = require("sandbox");

util.forEachApply([

    [["%d", 10], "10"],
    [["%d", 1.1], "1"],
    [["%0d", 1.1], "1"],
    [["%02d", 1.1], "01"],
    [["%02.2d", 1.1], "01"],
    [["%.2f", 1.1], "1.10"],
    [["%05.2f", 1.1], "01.10"],
    [["%06.2f", 1.1], "001.10"],
    [["%06.1f", 1.1], "0001.1"],
    [["%x", 255], "ff"],
    [["%X", 255], "FF"],
    [["%6x", 255], "    ff"],
    [["%06x", 255], "0000ff"],
    [["%6X", 255], "    FF"],
    [["%06X", 255], "0000FF"],
    [["%x", 0], "0"],
    [["%o", 0755], "755"],

    // distinguish u and d
    [["%u", -1], "4294967295"],
    [["%d", -1], "-1"],

    // accept i in place of d
    [["%i", 10], "10"],
    [["%i", 1.1], "1"],
    [["%0i", 1.1], "1"],
    [["%02i", 1.1], "01"],
    [["%02.2i", 1.1], "01"],
    [["%i", -1], "-1"],

    // accept u in place of d, for positives
    [["%u", 10], "10"],
    [["%u", 1.1], "1"],
    [["%0u", 1.1], "1"],
    [["%02u", 1.1], "01"],
    [["%02.2u", 1.1], "01"],

    // beyond spec
    [["%b", 2], "10"],
    [["%8b", 255], "11111111"],
    [["%8b", -1], "11111111"],
    [["%08b", 2], "00000010"],

    // some unit tests from http://paste.factorcode.org/paste?id=4
    [["%d", 10], "10"],
    //[["%f", 123.456], "123.456"], // original
    [["%f", 123.456], "123.456000"], // concurs with python
    [["%01.2f", 123.10], "123.10"],
    [["%.4f", 1.2345], "1.2345"],
    [["%01.2f", 123.1], "123.10"],
    //[["%.4f", 1.23456789], "1.2345"], // original
    [["%.4f", 1.23456789], "1.2346"], // concurs with python
    [["%6.2f", 1.23456789], "  1.23"],
    //[["%e", 123400000], "1.234e+08"], // original
    [["%e", 123400000], "1.234000e+08"], // concurs with python
    [["%e", 123456700], "1.234567e+08"],
    [["%.3e", 36252500], "3.625e+08"],
    //[["%e", 0.0025], "2.5e-03"], // original
    [["%e", 0.0025], "2.500000e-03"], // concurs with python
    //[["%E", 0.0025], "2.5E-03"], // original
    [["%E", 0.0025], "2.500000E-03"], // concurs with python
    [["%x", 0xff], "ff"],
    [["%X", 0xff], "FF"],
    [["%0x", 0xf], "f"],
    [["%0X", 0xf], "F"],
    [["%02x", 0xf], "0f"],
    [["%02X", 0xf], "0F"],
    [["%04d-%02d-%02d", 2008, 9, 10], "2008-09-10"],
    [["%s", "Hello, World!"], "Hello, World!"],
    [["printf test", ], "printf test"],
    [["char %c = 'a'", "a".charCodeAt()], "char a = 'a'"],
    [["%02x", 0], "00"],
    [["%02x", 0xff], "ff"],
    //[["%d %s(s)%", 0, "message"], "0 message(s)"], // original, but redacted
    [["%d %s(s)", 0, "message"], "0 message(s)"],
    [["%d %s(s) with %%", 0, "message"], "0 message(s) with %"],
    [["justif: \"%-10s\"", "left"], "justif: \"left      \""],
    [["justif: \"%10s\"", "right"], "justif: \"     right\""],
    [[" 3: %04d zero padded", 3], " 3: 0003 zero padded"],
    [[" 3: %-4d left justif", 3], " 3: 3    left justif"],
    [[" 3: %4d right justif", 3], " 3:    3 right justif"],
    [[" -3: %04d zero padded", -3], " -3: -003 zero padded"],
    [[" -3: %-4d left justif", -3], " -3: -3   left justif"],
    [[" -3: %4d right justif", -3], " -3:   -3 right justif"],
    [["There are %d monkeys in the %s", 10, "kitchen"], "There are 10 monkeys in the kitchen"],
    [["%d", 10], "10"],
    [["[%s]", "monkey"], "[monkey]"],
    [["[%10s]", "monkey"], "[    monkey]"],
    [["[%-10s]", "monkey"], "[monkey    ]"],
    [["[%010s]", "monkey"], "[0000monkey]"],
    //[["[%'#10s]", "monkey"], "[####monkey]"], // original
    //[["[%#10s]", "monkey"], "[####monkey]"], // sensible
    [["[%#10s]", "monkey"], "[    monkey]"], // concurs with python
    [["[%10.10s]", "many monkeys"], "[many monke]"]
], function (input, expected) {
    exports['test ' + util.repr(input)] = function () {
        var actual = format.sprintf.apply(null, input);
        assert.eq(expected, actual);
    };
});

/*
exports.testPrintfB = function () {
};

exports.testPrintfO = function () {
};

exports.testPrintfU = function () {
};
*/

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

