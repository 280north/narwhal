load("core.js");

File = require("file.js").File;

var inputFilename = "core.js",
    tmpFilename = "filetest.tmp";

f = new File(inputFilename, "r");
a = f.read();
f.close();

print(a.bytes + " length="+a.bytes.length);
print(File.size(inputFilename) === a.getLength());

f = new File(tmpFilename, "w");
f.write(a);
f.close();

b = File.read(tmpFilename);

print(b.bytes + " length="+b.bytes.length);
print(a.getLength() === b.getLength());
print(a.toString() === b.toString());
print(File.size(tmpFilename) === b.getLength());
