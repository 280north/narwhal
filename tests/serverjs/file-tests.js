var assert = require("test/assert");

var File = require("file");

exports.testWriteRead = function() {
    var contents = "hello world\n";
    
    File.write("foobarbaz", contents);
    
    var read = File.read("foobarbaz");
    
    assert.isEqual(contents, read);
    
    File.remove("foobarbaz");
};

exports.testRmtreeDoesNotFollowSymlinks = function () {
    var here = File.path(module.path).dirname();
    if (here.join('foo').exists())
        here.join('foo').rmtree();
    try {
        here.join('foo', 'bar').mkdirs();
        here.join('foo', 'baz').symlink('../bar');
        here.join('foo', 'baz').rmtree();
        assert.isTrue(here.join('foo', 'bar').exists());
    } finally {
        here.join('foo').rmtree();
    }
};

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
