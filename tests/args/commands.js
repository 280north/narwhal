
// -- abhinav Abhinav Gupta Copyright (C) 2009-2010 MIT License

var assert = require("assert");
var test = require("../args");

exports['test command'] = function () {
    var parser = new test.Parser();

    var called = false;
    parser.command('list', function () { called = true });

    parser.parse(['c', 'list', 'other']);
    assert.ok(called, "given command should be called");
};

if (require.main == module.id)
    require("os").exit(require("test").run(exports));
