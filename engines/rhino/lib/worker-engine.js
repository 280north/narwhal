
// -- kriszyp Kris Zyp

exports.createEnvironment = function(){
    var workerQueue, 
        workerGlobal = new org.mozilla.javascript.tools.shell.Global();
    javaWorkerGlobal = new org.mozilla.javascript.NativeJavaObject(global, workerGlobal, null);
    javaWorkerGlobal.init(org.mozilla.javascript.tools.shell.Main.shellContextFactory);
    workerGlobal.NARWHAL_HOME = system.prefix;
    workerGlobal.NARWHAL_ENGINE_HOME = system.prefix + '/engines/' + system.engine;
    // get the path to the bootstrap.js file
    var bootstrapPath = system.prefix + '/engines/' + system.engine + "/bootstrap.js";
    org.mozilla.javascript.tools.shell.Main.processFile(
        org.mozilla.javascript.Context.enter(), 
        workerGlobal,
        bootstrapPath);

    return workerGlobal;
};

exports.spawn = function(functionToRun, threadName){
	var sourceContext = Packages.org.mozilla.javascript.Context.getCurrentContext();
	var classLoader = sourceContext.getApplicationClassLoader();
    (new java.lang.Thread(function(){
       	var context = Packages.org.mozilla.javascript.Context.getCurrentContext();
        context.setOptimizationLevel(sourceContext.getOptimizationLevel());
        context.setLanguageVersion(sourceContext.getLanguageVersion());
        context.setApplicationClassLoader(classLoader);
      	context.getWrapFactory().setJavaPrimitiveWrap(sourceContext.getWrapFactory().isJavaPrimitiveWrap());
	
	functionToRun();
    }, threadName)).start();
};

