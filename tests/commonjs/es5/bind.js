
var assert = require("test/assert");

exports.testThis = function () {
    var foo = function (y) {
        return this.x + y;
    };
    assert.eq(20, foo.bind({x:10})(10));
};

exports.testPartial = function () {
    var foo = function (y) {
        return this.x + y;
    };
    assert.eq(20, foo.bind({x:10}, 10)());
};

exports.testConstructor = function () {
    var Foo = function (x, y) {
        this.a = x + y;
    };
    assert.eq(30, new (Foo.bind())(10, 20).a);
    assert.eq(30, new (Foo.bind(10))(20).a);
    assert.eq(30, new (Foo.bind(10, 20))().a);
};

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

