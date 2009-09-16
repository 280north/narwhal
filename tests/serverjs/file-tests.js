
var assert = require("test/assert");
var fs = require("file");
var binary = require('binary');

exports.testWriteRead = function() {
    try {
        var path = "testWriteRead.txt";
        var content = "testWriteRead.txt\n";
        fs.write(path, content);
        assert.is(content, fs.read(path));
    } finally {
        fs.remove(path);
    }
}; 

exports.testOpenWriteReadWrongMode = function () {
    var path = "testOpenWriteReadWrongMode.txt";
    var content = "testOpenWriteReadWrongMode.txt\n";
    assert.throwsError(function () {
        fs.open(path).write(content).flush().close();
        fs.remove(path);
    });
};

exports.testOpenWriteFlushRead = function () {
    try {
        var path = "testOpenWriteRead.txt";
        var content = "testOpenWriteRead.txt\n";
        fs.open(path, 'w').write(content).flush().close();
        assert.is(content, fs.open(path).read());
    } finally {
        fs.remove(path);
    }
};

exports.testOpenWriteRead = function () {
    try {
        var path = "testOpenWriteRead.txt";
        var content = "testOpenWriteRead.txt\n";
        fs.open(path, 'w').write(content);
        assert.is("", fs.open(path).read());
    } finally {
        fs.remove(path);
    }
};

exports.testOpenWriteReadFlushOnClose = function () {
    try {
        var path = "testOpenWriteRead.txt";
        var content = "testOpenWriteRead.txt\n";
        fs.open(path, 'w').write(content).close();
        assert.is(content, fs.open(path).read());
    } finally {
        fs.remove(path);
    }
};

exports.testPathWriteRead = function () {
    try {
        var path = "testOpenWriteRead.txt";
        var content = "testOpenWriteRead.txt\n";
        fs.path(path).write(content);
        assert.is(content, fs.path(path).read());
    } finally {
        fs.remove(path);
    }
};

exports.testNewPathWriteRead = function () {
    try {
        var path = "testNewPathWriteRead.txt";
        var content = "testNewPathWriteRead.txt\n";
        new fs.Path(path).write(content);
        assert.is(content, new fs.Path(path).read());
    } finally {
        fs.remove(path);
    }
};

exports.testBigPathOpenWriteRead = function () {
    try {
        var path = "testBigPathWriteRead.txt";
        var content = "testBigPathWriteRead.txt\n";
        fs.Path(path).write(content);
        assert.is(content, fs.Path(path).read());
    } finally {
        fs.remove(path);
    }
};

exports.testLittlePathOpenWriteRead = function () {
    var path = "testLittlePathWriteRead.txt";
    var content = "testLittlePathWriteRead.txt\n";
    assert.throwsError(function () {
        fs.path(path).open().write(content).flush().close();
        fs.remove(path);
    });
};

exports.testLittlePathOpenWriteRead = function () {
    try {
        var path = "testLittlePathOpenWriteRead.txt";
        var content = "testLittlePathOpenWriteRead.txt\n";
        fs.path(path).open('w').write(content).flush().close();
        assert.is(content, fs.path(path).open().read());
    } finally {
        fs.remove(path);
    }
};

exports.testWriteReadNewlineEnforced = function() {
    try {
        var path = "testWriteReadNewlineEnforced.txt";
        var content = "testWriteReadNewlineEnforced.txt";
        fs.write(path, content);
        assert.is(content + "\n", fs.read(path));
    } finally {
        fs.remove(path);
    }
}; 

exports.testWriteReadBinaryWrongMode = function () {
    var path = "testWriteReadBinaryModeWrongMode.txt";
    var content = "\0\0\0".toByteString("ascii");
    assert.throwsError(function () {
        fs.path(path).open('b').write(content).flush().close();
        fs.remove(path);
    });
};

exports.testWriteReadBinary = function () {
    try {
        var path = "testWriteReadBinary.txt";
        var content = "aaa".toByteString("ascii");
        fs.path(path).open('wb').write(content).flush().close();
        assert.eq(content, fs.path(path).open('b').read());
    } finally {
        fs.remove(path);
    }
};

exports.testWriteReadBinaryNulls = function () {
    try {
        var path = "testWriteReadBinaryNulls.txt";
        var content = "\0\0\0".toByteString("ascii");
        fs.path(path).open('wb').write(content).flush().close();
        assert.eq(content, fs.path(path).open('b').read());
    } finally {
        fs.remove(path);
    }
};

exports.testPrintRead = function () {
    try {
        var path = "testPrintRead.txt";
        fs.path(path).open('w').print("hello").print("world");
        assert.is("hello\nworld\n", fs.path(path).open().read());
    } finally {
        fs.remove(path);
    }
};

exports.testCopy = function () {
    try {
        fs.path("testCopyA.txt").write("testCopy").copy("testCopyB.txt");
        assert.is("testCopy\n", fs.read("testCopyB.txt"));
    } finally {
        fs.remove("testCopyA.txt");
        fs.remove("testCopyB.txt");
    }
};

exports.testCopyChain = function () {
    try {
        fs.path("testCopyA.txt").write("testCopy").copy("testCopyB.txt").copy("testCopyC.txt");
        assert.is("testCopy\n", fs.read("testCopyC.txt"));
    } finally {
        fs.remove("testCopyA.txt");
        fs.remove("testCopyB.txt");
        fs.remove("testCopyC.txt");
    }
};

exports.testMoveExists = function () {
    try {
        fs.path("testCopyA.txt").write("testCopy").move("testCopyB.txt");
        assert.isFalse(fs.exists("testCopyA.txt"));
        assert.isTrue(fs.exists("testCopyB.txt"));
    } finally {
        if (fs.exists("testCopyA.txt"))
            fs.remove("testCopyA.txt");
        if (fs.exists("testCopyB.txt"))
            fs.remove("testCopyB.txt");
    }
};

exports.testsExists = function () {
    assert.isTrue(fs.exists(module.path));
    assert.isTrue(fs.path(module.path).exists());
};

exports.testsIsFile = function () {
    assert.isTrue(fs.isFile(module.path));
    assert.isTrue(fs.path(module.path).isFile());
};

exports.testsIsDirectoryDirname = function () {
    assert.isTrue(fs.path(module.path).dirname().isDirectory());
};

exports.testsIsDirectoryResolve = function () {
    assert.isTrue(fs.path(module.path).resolve('.').isDirectory());
};

exports.testsRenameList = function () {
    try {
        fs.mkdir('testsRename');
        fs.path('testsRename', 'A.txt').touch();
        assert.eq(fs.path('testsRename').list(), ['A.txt']);
        fs.path('testsRename', 'A.txt').rename('B.txt');
        assert.eq(fs.path('testsRename').list(), ['B.txt']);
    } finally {
        fs.rmtree('testsRename');
    }
};

exports.testIterator = require('./file/iterator');
exports.testExtension = require('./file/extension');
exports.testResolve = require('./file/resolve');
exports.testNormal = require('./file/normal');
exports.testDirname = require('./file/dirname');
exports.testIsAbsolute = require('./file/is-absolute');

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

