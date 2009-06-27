var assert = require("test/assert");
var os = require("os");
var io = require("io");

exports.testArrayCommunicateStdout = function () {
    var list = io.StringIO();
    list.print("30");
    list.print("4");
    list.print("1000");
    list.print("200");

    var process = os.popen(["sort", "-n", "-"]);
    var lines = [];
    process.communicate(list).stdout.forEach(function (line) {
        lines.push(line);
    });

    assert.isSame(lines, ["4", "30", "200", "1000"]);
};

if (require.main === module.id)
    os.exit(require("test/runner").run(exports));

