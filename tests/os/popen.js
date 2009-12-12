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

    assert.eq(["4", "30", "200", "1000"], lines);
};

exports.testCommunicateStatus = function () {
    assert.eq(255, os.popen("exit -1").communicate().status);
    assert.eq(255, os.popen("exit -1").wait());
};

exports.testCommunicateStdout = function () {
    assert.eq("hi\n", os.popen("echo hi").communicate().stdout.read());
    assert.eq("hi\n", os.popen("cat").communicate("hi").stdout.read());
};

exports.testCommunicateStderr = function () {
    assert.eq("hi\n", os.popen("echo hi >&2").communicate().stderr.read());
};

exports.testCommunicateStdin = function () {
    assert.eq("", os.popen("exit 0").communicate("hi").stdin.read());
};

if (require.main === module.id)
    os.exit(require("test/runner").run(exports));

