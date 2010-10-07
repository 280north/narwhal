
var UTIL = require("narwhal/util");
var FILE = require("file");
var ASSERT = require("assert");

exports.getInfo = function(visited) {
    
    visited = visited || [];
    
    var basePath = FILE.Path(module.path);
    while(basePath.basename()!="_files") {
        basePath = basePath.dirname();
    }

    var info = {
        "id": basePath.relative(module.id).valueOf(),
        "path": basePath.relative(module.path).valueOf(),
        "package": module["package"],
        "using": module.using
    }
    
    if(UTIL.has(visited, info.id)) {
        return "RECURSION";
    }
    visited.push(info.id);
    
    if(UTIL.len(module.using)>0) {
        info.subInfo = {};
        UTIL.every(module.using, function(item) {
            var preVisited = UTIL.copy(visited);
            var subInfo = require("main", item[0]).getInfo(visited);
            ASSERT.deepEqual(
                subInfo,
                require("main", item[1]).getInfo(preVisited)
            );
            info.subInfo[item[0]] = subInfo;

        });
    } else {
        if(info.id=="_files/test-sea/lib/main") {
            info.subInfo = require("main", "test-package-1").getInfo(visited);
        }
    }
    
    return info;
}
