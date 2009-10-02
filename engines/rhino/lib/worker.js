
var Worker = exports.Worker = function(scriptName){
    return createWorker(scriptName);
};
function createWorker(scriptName, worker, args){
    worker = worker || {
            postMessage: function(message){
                workerQueue.enqueue(function(){
                    var event = {
                        target: workerGlobal,
                        data: message,
                    }
                    if(typeof workerGlobal.onmessage == "function"){
                        workerGlobal.onmessage(event);
                    }
                });
            },
            postData: function(message){
                workerQueue.enqueue(function(){
                    var event = {
                        target: workerGlobal,
                        // this can be optimized to be much faster
                        data: workerGlobal.JSON.parse(JSON.stringify(message)), 
                    }
                    if(typeof workerGlobal.onmessage == "function"){
                        workerGlobal.onmessage(event);
                    }
                });
            },
            // allows for sending a message with a direct object reference.
            // this is not part of CommonJS, and must be used with great care.
            __enqueue__: function(eventName, args){
                workerQueue.enqueue(function(){
                    if(typeof workerGlobal[eventName] == "function"){
                        workerGlobal[eventName].apply(workerGlobal, args);
                    }
                });
            },
            isIdle: function(){
                return workerQueue.isEmpty();
            }
        };
        var queue = require("event-queue"),
            workerQueue, 
        workerGlobal = new org.mozilla.javascript.tools.shell.Global();
        javaWorkerGlobal = new org.mozilla.javascript.NativeJavaObject(global, workerGlobal, null);
        javaWorkerGlobal.init(org.mozilla.javascript.tools.shell.Main.shellContextFactory);
        if(args){
            workerGlobal.arguments = args;
        }
    // crazy hack to get the path to the bootstrap.js file :/
    var bootstrapPath = system.enginePrefix + "/bootstrap.js";
    org.mozilla.javascript.tools.shell.Main.processFile(
        org.mozilla.javascript.Context.enter(), 
        workerGlobal,
        bootstrapPath);
    var paths = workerGlobal.require.paths;
    paths.splice(0, paths.length) // unless there's a better way to empty an array?
    paths.push.apply(paths, require.paths);
    workerGlobal.postMessage = function(message){
        queue.enqueue(function(){
            var event = {
                target: worker,
                data: message
            }
            if(typeof worker.onmessage == "function"){
                worker.onmessage(event);
            }
        });
    }
    workerQueue = workerGlobal.require("event-queue");
    workerQueue.__sharedWorkers__ == exports.__sharedWorkers__;
        var thread = new java.lang.Thread(function(){
        workerGlobal.require(scriptName);
        while(true){
            try{
                workerQueue.nextEvent()();
                print("worker.onidle " + worker.onidle );
                if(workerQueue.isEmpty() && typeof worker.onidle == "function"){
                    queue.enqueue(function(){
                        worker.onidle();
                    });
                }
            }catch(e){
                // this needs to be delegated to the onerror handler
                print(e);
            }
        }
        }, "Worker thread");
        thread.start();
        return worker;
};

exports.__sharedWorkers__ = {};

exports.SharedWorker = function(scriptName, workerName){
    var worker = exports.__sharedWorkers__[workerName] = exports.__sharedWorkers__[workerName] || {};
    //TODO: create ports as well
    return createWorker(scriptName, worker);
}

exports.__WorkerWithArgs__ = function(scriptName, args){
    return createWorker(scriptName, null, args);
}