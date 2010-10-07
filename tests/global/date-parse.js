
var UTIL = require("narwhal/util");
var ASSERT = require("assert");

[
    "2010-01-01T00:00:00.000Z",
].forEach(function (isoDate) {
    exports['testReflexiveParseFormat ' + isoDate] = function () {
        var parsed = Date.parse(isoDate);
        ASSERT.equal(new Date(parsed).toISOString(), isoDate);
    };
});

UTIL.forEachApply([
    ["2010", "2010-01-01T00:00:00.000Z"],
    ["2010-01", "2010-01-01T00:00:00.000Z"],
    ["2010-01-01", "2010-01-01T00:00:00.000Z"],
    ["2010-01-01T00:00Z", "2010-01-01T00:00:00.000Z"],
    ["2010-01-01T00:00:00Z", "2010-01-01T00:00:00.000Z"],
    ["2010-01-01T00:00:00.000Z", "2010-01-01T00:00:00.000Z"],
    ["2010-01-01T00:00:00.000+01:01", "2010-01-01T01:01:00.000Z"], // explicit timezone
    /* not really realistic to get these working:
    ["0010", "0010-01-01T00:00:00.000Z"], // before 1900
    ["0010-01", "0010-01-01T00:00:00.000Z"],
    ["0010-01-01", "0010-01-01T00:00:00.000Z"],
    ["+100000-01-01T00:00:00.000Z", "+100000-01-01T00:00:00.000Z"],
    ["-100000-01-01T00:00:00.000Z", "-100000-01-01T00:00:00.000Z"],
    ["+002010-01-01T00:00:00.000Z", "2010-01-01T00:00:00.000Z"]
    */
], function (input, output) {
    exports['testNonReflexiveParseFormat ' + input] = function () {
        var parsed = Date.parse(input);
        ASSERT.equal(new Date(parsed).toISOString(), output);
    };
});

exports.testTimes = function () {
    ASSERT.equal(Date.parse("T00:00:00.001"),        1);
    ASSERT.equal(Date.parse("T00:00:01.000"),     1000);
    ASSERT.equal(Date.parse("T00:01:00.000"),    60000);
    ASSERT.equal(Date.parse("T01:00:00.000"),  3600000);
};

if (require.main == module)
    require("test").run(exports);

