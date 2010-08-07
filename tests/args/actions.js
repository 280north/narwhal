
// -- abhinav Abhinav Gupta Copyright (C) 2009-2010 MIT License

var assert = require("assert");
var test = require("../args");

exports['test parser with single action'] = function () {
    var parser = new test.Parser();
    var wasExecuted = false;

    parser.action(function () { wasExecuted = true });
    parser.act(['c'], {});

    assert.ok(wasExecuted);
};

exports['test parser with multiple actions'] = function () {
    var parser = new test.Parser();
    var order = [];
    
    // add actions which push 1 - 3 to order.
    parser.action(function () { order.push(1) });
    parser.action(function () { order.push(2) });
    parser.action(function () { order.push(3) });

    // when parsing, the numbers should be pushed in the correct order
    
    parser.act(['c'], {});
    assert.deepEqual(order, [1,2,3]);
};

if (require.main == module.id)
    require("os").exit(require("test").run(exports));

