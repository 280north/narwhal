
var assert = require("test/assert");
var fs = require("file");

/* a decorator that passes a path object corresponding
   to the test name and removes any files created
   therein afterward */
var Test = function (block) {
    var args = arguments;
    var exported = function () {
        for (var name in exports) {
            if (exports[name] === exported) {
                try {
                    var path = fs.path(
                        fs.resolve(module.path, '.'),
                        name
                    );
                    block(path);
                } finally {
                    if (path.exists())
                        path.rmtree();
                }
            }
        }
    };
    return exported;
};

exports.testPrintReadLine = Test(function (path) {
    var stream = path.open('w');
    stream.print('hello');
    stream.print('world');
    stream.close();
    stream = path.open('r');
    assert.is('hello\n', stream.readLine());
    assert.is('world\n', stream.readLine());
    assert.is('', stream.readLine());
});

exports.testPrintReadLineChain = Test(function (path) {
    var stream = path.open('w');
    stream.print('hello').print('world');
    stream.close();
    stream = path.open('r');
    assert.is('hello\n', stream.readLine());
    assert.is('world\n', stream.readLine());
    assert.is('', stream.readLine());
});

exports.testReadLines = Test(function (path) {
    var stream = path.open('w');
    stream.print('hello').print('world');
    stream.close();
    stream = path.open('r');
    assert.eq(['hello\n', 'world\n'], stream.readLines());
});

exports.testForEach = Test(function (path) {
    var output = path.open('w');
    var input = path.open('r');
    output.print('1');
    output.print('1');
    var count = 0;
    input.forEach(function (line) {
        assert.eq('1', line);
        count++;
    });
    assert.eq(2, count);
    output.print('2').print('2');
    input.forEach(function (line) {
        assert.eq('2', line);
        count++;
    });
    assert.eq(4, count);
    output.close();
    input.close();
});

exports.testNext = Test(function (path) {
    path.open('w').print('1').print('2').close();
    var iterator = path.open();
    assert.is('1', iterator.next());
    assert.is('2', iterator.next());
    assert.throwsError(function () {
        iterator.next();
    });
});

exports.testIterator = Test(function (path) {
    path.open('w').print('1').print('2').close();
    var iterator = path.open().iterator();
    assert.is('1', iterator.next());
    assert.is('2', iterator.next());
    assert.throwsError(function () {
        iterator.next();
    });
});

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

