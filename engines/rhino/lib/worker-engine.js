exports.createEnvironment = function(){
    var workerQueue, 
        workerGlobal = new org.mozilla.javascript.tools.shell.Global();
    javaWorkerGlobal = new org.mozilla.javascript.NativeJavaObject(global, workerGlobal, null);
    javaWorkerGlobal.init(org.mozilla.javascript.tools.shell.Main.shellContextFactory);
    workerGlobal.NARWHAL_HOME = system.prefix;
    workerGlobal.NARWHAL_ENGINE_HOME = system.enginePrefix;
    // get the path to the bootstrap.js file
    var bootstrapPath = system.enginePrefix + "/bootstrap.js";
    org.mozilla.javascript.tools.shell.Main.processFile(
        org.mozilla.javascript.Context.enter(), 
        workerGlobal,
        bootstrapPath);
    return workerGlobal;
};

exports.spawn = function(functionToRun){
    (new java.lang.Thread(functionToRun)).start();
};

exports.defaultErrorReporter = function(e){
    print((e.rhinoException && e.rhinoException.printStackTrace()) || (e.name + ": " + e.message));
};