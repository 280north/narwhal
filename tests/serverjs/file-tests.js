
var assert = require("test/assert");
var fs = require("file");
var binary = require('binary');

exports.testWriteRead = function() {
    try {
        var path = "testWriteRead.txt";
        var content = "testWriteRead.txt\n";
        fs.write(path, content);
        assert.isEqual(content, fs.read(path));
    } finally {
        fs.remove(path);
    }
}; 

exports.testOpenWriteReadWrongMode = function () {
    var path = "testOpenWriteReadWrongMode.txt";
    var content = "testOpenWriteReadWrongMode.txt\n";
    assert.throwsError(function () {
        fs.open(path).write(content);
        fs.remove(path);
    });
};

exports.testOpenWriteRead = function () {
    try {
        var path = "testOpenWriteRead.txt";
        var content = "testOpenWriteRead.txt\n";
        fs.open(path, 'w').write(content);
        assert.isEqual(content, fs.open(path).read());
    } finally {
        fs.remove(path);
    }
};

exports.testPathWriteRead = function () {
    try {
        var path = "testOpenWriteRead.txt";
        var content = "testOpenWriteRead.txt\n";
        fs.path(path).write(content);
        assert.isEqual(content, fs.path(path).read());
    } finally {
        fs.remove(path);
    }
};

exports.testNewPathWriteRead = function () {
    try {
        var path = "testNewPathWriteRead.txt";
        var content = "testNewPathWriteRead.txt\n";
        new fs.Path(path).write(content);
        assert.isEqual(content, new fs.Path(path).read());
    } finally {
        fs.remove(path);
    }
};

exports.testBigPathOpenWriteRead = function () {
    try {
        var path = "testBigPathWriteRead.txt";
        var content = "testBigPathWriteRead.txt\n";
        fs.Path(path).write(content);
        assert.isEqual(content, fs.Path(path).read());
    } finally {
        fs.remove(path);
    }
};

exports.testLittlePathOpenWriteRead = function () {
    var path = "testLittlePathWriteRead.txt";
    var content = "testLittlePathWriteRead.txt\n";
    assert.throwsError(function () {
        fs.path(path).open().write(content);
        fs.remove(path);
    });
};

exports.testLittlePathOpenWriteRead = function () {
    try {
        var path = "testLittlePathOpenWriteRead.txt";
        var content = "testLittlePathOpenWriteRead.txt\n";
        fs.path(path).open('w').write(content);
        assert.isEqual(content, fs.path(path).open().read());
    } finally {
        fs.remove(path);
    }
};

exports.testWriteReadNewlineEnforced = function() {
    try {
        var path = "testWriteReadNewlineEnforced.txt";
        var content = "testWriteReadNewlineEnforced.txt";
        fs.write(path, content);
        assert.isEqual(content, fs.read(path) + "\n");
    } finally {
        fs.remove(path);
    }
}; 

exports.testWriteReadBinaryWrongMode = function () {
    var path = "testWriteReadBinaryModeWrongMode.txt";
    var content = "\0\0\0".toByteString("ascii");
    assert.throwsError(function () {
        fs.path(path).open('b').write(content);
        fs.remove(path);
    });
};

exports.testWriteReadBinary = function () {
    try {
        var path = "testWriteReadBinary.txt";
        var content = "aaa".toByteString("ascii");
        fs.path(path).open('wb').write(content);
        assert.isEqual(content, fs.path(path).open('b').read());
    } finally {
        fs.remove(path);
    }
};

exports.testWriteReadBinaryNulls = function () {
    try {
        var path = "testWriteReadBinaryNulls.txt";
        var content = "\0\0\0".toByteString("ascii");
        fs.path(path).open('wb').write(content);
        assert.isEqual(content, fs.path(path).open('b').read());
    } finally {
        fs.remove(path);
    }
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

