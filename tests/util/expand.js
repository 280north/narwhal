
var assert = require("test/assert");
var util = require("narwhal/util");

var expandOracle = function (line, tabLength, initial) {
    if (!tabLength) tabLength = 4;
    if (initial === undefined) initial = 0;
    var at = initial;
    var result = '';
    for (var i = 0; i < line.length; i++) {
        var c = line.charAt(i);
        if (c == "\n") {
            at = initial;
            result += c;
        } else if (c == "\r") {
            result += c;
        } else if (c == "\t") {
            var next = (at & ~(tabLength - 1)) + tabLength;
            result += util.mul(' ', next - at);
            at = next;
        } else {
            at++;
            result += c;
        }
    }
    return result;
};

var inputs = [
    "\t",
    " \t",
    "  \t",
    "   \t",
    "\t\t"
];

util.forEach(inputs, function (input) {
    exports['test ' + util.repr(input)] = function () {
        assert.eq(expandOracle(input), util.expand(input));
    };
});

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

