var FILE = require("file");
var OS = require("os");
var JAKE = require("jake");

JAKE.task("default", ["build"]);
JAKE.task("build", ["lib/inflate.js"]);

// lib/jscrypto.js: jscrypto/js/jscrypto.js src/post.js
//  mkdir -p lib
//  cat $< > $@
JAKE.file("lib/inflate.js", ["src/inflate.js", "src-commonjs/inflate-post.js"], function(t) {
    FILE.mkdirs("lib");
    
    var output = FILE.open(t.name(), "w");
    t.prerequisites().forEach(function(source) {
        FILE.open(source, "r").copy(output).close();
    });
    output.close();
});
