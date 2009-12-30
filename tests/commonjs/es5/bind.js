
var assert = require("assert");

exports.testThis = function () {
    var foo = function (y) {
        return this.x + y;
    };
    assert.equal(20, foo.bind({x:10})(10));
};

exports.testPartial = function () {
    var foo = function (y) {
        return this.x + y;
    };
    assert.equal(20, foo.bind({x:10}, 10)());
};

/* XXX disputed
exports.testConstructor = function () {
    var Foo = function (x, y) {
        this.a = x + y;
    };
    assert.equal(30, new (Foo.bind())(10, 20).a);
    assert.equal(30, new (Foo.bind(10))(20).a);
    assert.equal(30, new (Foo.bind(10, 20))().a);
};
*/

if (require.main == module)
    require("os").exit(require("test").run(exports));

