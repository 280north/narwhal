var assert = require("test/assert");
var os = require("os");

// FIXME: these will probably fail on Windows
var systemTests = [
    ["true", 0],
    ["false", 1],
    ["exit 2", 2],
    ["exit 255", 255],
    ["exit 256", 0],
    ["exit 257", 1]
]

systemTests.forEach(function(test) {
    exports["test system('"+test[0]+"') == " + test[1]] = function() {
        assert.eq(test[1], os.system(test[0]))
    }
});

if (require.main === module.id)
    os.exit(require("test/runner").run(exports));

