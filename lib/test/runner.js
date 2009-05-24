var AssertionError = require("./assert");

exports.run = function(objectOrModule, context) {
    if (typeof objectOrModule === "string")
        objectOrModule = require(objectOrModule);

    if (!objectOrModule)
        throw "Nothing to run";

    var localContext = context || { passed : 0, failed : 0, error : 0, depth : 0 };
    localContext.depth++;
    
    for (var spaces=""; spaces.length < localContext.depth * 2; spaces += "  ");
    
    for (var property in objectOrModule) {
        if (property.match(/^test/)) {
            print(spaces + "+ Running "+property);
            if (typeof objectOrModule[property] == "function") {
                if (typeof objectOrModule.setup === "function")
                    objectOrModule.setup();
                try {
                    objectOrModule[property]();
                    localContext.passed++;
                } catch (e) {
                    if (e.name === "AssertionError") {
                        print("Assertion Failed in "+property+": " + e);
                        
                        if (e.rhinoException)
                            e.rhinoException.printStackTrace();
                        else if (e.javaException)
                            e. javaException.printStackTrace();
                        
                        localContext.failed++;
                    } else {
                        print("Exception in "+property+": " + e);
                        
                        if (e.rhinoException)
                            e.rhinoException.printStackTrace();
                        else if (e.javaException)
                            e. javaException.printStackTrace();
                        
                        localContext.error++;
                    }
                } finally {
                    if (typeof objectOrModule.teardown === "function")
                        objectOrModule.teardown();
                }
            } else {
                exports.run(objectOrModule[property], localContext);
            }
        }
    }
    
    localContext.depth--;

    if (context === undefined)
        print("Passed "+localContext.passed+"; Failed "+localContext.failed+"; Error "+localContext.error+";");

    return localContext.failed + localContext.error;
}
