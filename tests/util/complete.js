var assert = require("test/assert");
var util = require("narwhal/util");

exports["test completes key"] = function() {
    assert.eq("world", util.complete({}, { hello: "world" }).hello);
};

exports["test does not complete key"] = function() {
    assert.eq("usa", util.complete({
        hello: "usa"
    }, {
        hello: "world"
    }).hello);
};

if (require.main == module.id)
    require("test/runner").run(exports);
