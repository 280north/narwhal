
var util = require("util");
var assert = require("test/assert");
var args = require("args");
var sandboxing = require("sandbox");
var loader = require("loader");
var os = require("os");

exports.test = function () {

    var accumulator = [];
    var subprint = function (text) {
        accumulator.push(text);
    };

    var supersandbox = sandboxing.Sandbox({
        'loader': require.loader,
        'print': subprint
    });

    var path = system.fs.path(module.path).resolve('./foo.js');
    var id = path.toString();
    var subsandboxing = supersandbox('sandbox');

    var subloader = loader.Loader({
        'paths': require.loader.paths,
        'debug': true
    });

    var sandbox1 = subsandboxing.Sandbox({
        'loader': subloader,
        'print': subprint
    });

    path.touch();
    os.sleep(1);
    assert.eq(0, accumulator.length);

    sandbox1(id);
    // must be loaded
    assert.eq(1, accumulator.length, '1.1');

    sandbox1(id);
    // must be cached
    assert.eq(1, accumulator.length, '1.2');

    var sandbox2 = subsandboxing.Sandbox({
        'loader': subloader,
        'print': subprint
    });

    sandbox2(id);
    // must still be cached in the loader
    assert.eq(1, accumulator.length, '2.1');
    path.touch();
    os.sleep(1);
    // still cached, although it has changed
    assert.eq(1, accumulator.length, '2.2');
    sandbox2(id);
    // still cached, although it has changed
    assert.eq(1, accumulator.length, '2.3');

    var sandbox3 = subsandboxing.Sandbox({
        'loader': subloader,
        'print': subprint
    });

    assert.eq(1, accumulator.length, '3.1');
    // cached, but changed
    sandbox3(id);
    // reloaded
    assert.eq(2, accumulator.length, '3.2');
    sandbox3(id);
    assert.eq(2, accumulator.length, '3.3');

}

if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));

