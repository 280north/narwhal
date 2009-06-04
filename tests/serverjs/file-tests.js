var assert = require("test/assert");

var File = require("file");

exports.testWriteRead = function() {
    var contents = "hello world\n";
    
    File.write("foobarbaz", contents);
    
    var read = File.read("foobarbaz");
    
    assert.isEqual(contents, read);
    
    File.remove("foobarbaz");
}