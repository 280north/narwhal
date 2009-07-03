var assert = require("test/assert");

var fs, binary;
exports.testRequire = function () {
    fs = require("file");
    binary = require('binary');
};

var path = "foobarbaz";
var content = "hello world\n";
var binaryContent = "\0\0\0".toByteString("ascii");

exports.testWriteRead = function() {
    fs.write(path, content);
    assert.isEqual(content, fs.read(path));
    fs.remove(path);
}; 

exports.testOpenWriteReadWrongMode = function () {
    assert.throwsError(function () {
        fs.open(path).write(content);
        fs.remove(path);
    });
};

exports.testOpenWriteRead = function () {
    fs.open(path, 'w').write(content);
    assert.isEqual(content, fs.open(path).read());
    fs.remove(path);
};

exports.testPathWriteRead = function () {
    fs.path(path).write(content);
    assert.isEqual(content, fs.path(path).read());
    fs.remove(path);
};

exports.testNewPathWriteRead = function () {
    new fs.Path(path).write(content);
    assert.isEqual(content, new fs.Path(path).read());
    fs.remove(path);
};

exports.testBigPathOpenWriteRead = function () {
    fs.Path(path).write(content);
    assert.isEqual(content, fs.Path(path).read());
    fs.remove(path);
};

exports.testLittelPathOpenWriteRead = function () {
    assert.throwsError(function () {
        fs.path(path).open().write(content);
        fs.remove(path);
    });
};

exports.testLittelPathOpenWriteRead = function () {
    fs.path(path).open('w').write(content);
    assert.isEqual(content, fs.path(path).open().read());
    fs.remove(path);
};

exports.testWriteReadBinaryModeWrongMode = function () {
    assert.throwsError(function () {
        fs.path(path).open('b').write(binaryContent);
    });
};

exports.testWriteReadBinaryMode = function () {
    fs.path(path).open('wb').write(binaryContent);
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

