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

var charsets = ["UTF-8", "UTF-16"];
var testString = "I ♥ JS";

exports.testRawStreams = function() {
    charsets.forEach(function(charset) {
        var p = os.popen(["cat"]);
        p.stdin.raw.write(testString.toByteString(charset)).flush().close();
        var result = p.stdout.raw.read().decodeToString(charset);
        assert.eq(testString, result);
    });
};

exports.testCharsetInputStream = function() {
    charsets.forEach(function(charset) {
        var p = os.popen(["cat"], { charset : charset });
        p.stdin.write(testString).flush().close();
        var result = p.stdout.raw.read().decodeToString(charset);
        assert.eq(testString, result);
        p.stdout.close();
        p.stderr.close();
    });
};

exports.testCharsetOutputStream = function() {
    charsets.forEach(function(charset) {
        var p = os.popen(["cat"], { charset : charset });
        p.stdin.raw.write(testString.toByteString(charset)).flush().close();
        var result = p.stdout.read();
        assert.eq(testString, result);
        p.stdout.close();
        p.stderr.close();
    });
};


if (require.main == module.id)
    os.exit(require("test/runner").run(exports));

