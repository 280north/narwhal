var queue = require("event-queue");
var workerEngine = require("worker-engine");

var Worker = exports.Worker = function(scriptName){
    var worker;
    createWorker(scriptName, function(workerQueue, global){
        worker = createPort(workerQueue, global);
        createPort(queue, worker, global);
        return worker;
    });
    return worker;
};

function createPort(queue, target, port){
    target.onmessage = true; // give it something to feature detect off of
    port = port || {
            // allows for sending a message with a direct object reference.
            // this is not part of CommonJS, and must be used with great care.
            __enqueue__: function(eventName, args){
                queue.enqueue(function(){
                    if(typeof target[eventName] == "function"){
                        target[eventName].apply(target, args);
                    }
                });
            }
        };
    port.postMessage = function(message){
        queue.enqueue(function(){
            var event = {
                //when is supposed to be the target, and when the ports? The spec is confusing
                target: target,
                ports: [target],
                data: message.toString(),
            }
            if(typeof target.onmessage == "function"){
                target.onmessage(event);
            }
        });
        };
    port.postData= function(message){
        queue.enqueue(function(){
            var event = {
                ports: [target],
                // this can be optimized to be much faster
                data: target.JSON.parse(JSON.stringify(message)), 
            }
            if(typeof target.ondata == "function"){
                target.ondata(event);
            }
        });
        };
    port.isIdle= function(){
        return queue.isEmpty();
    };
    return port;
}
function createWorker(scriptName, setup){
    var workerQueue, 
        workerGlobal = workerEngine.createEnvironment();
    
    // add the module lookup paths from our environment
    var paths = workerGlobal.require.paths;
    paths.splice(0, paths.length);
    paths.push.apply(paths, require.paths);
    
    // get the event queue
    workerQueue = workerGlobal.require("event-queue");
    
    // calback for dedicated and shared workers to do their thing
    var worker = setup(workerQueue, workerGlobal);
    
    // there must be one and only one shared worker map amongst all workers
    workerGlobal.require("system").__sharedWorkers__ = system.__sharedWorkers__;

    workerEngine.spawn(function(){
        workerGlobal.require(scriptName);
        // enter the event loop
        while(true){
            try{
                workerQueue.nextEvent()();
                if(workerQueue.isEmpty()){
                    // fire onidle events when empty, this allows to do effective worker pooling
                    queue.enqueue(function(){
                       if(worker && worker.onidle){
                           worker.onidle();
                       }
                    });
                }
            }catch(e){
                workerQueue.enqueue(function(){
                    if(typeof workerGlobal.onerror === "function"){
                        // trigger the onerror event in the worker if an error occurs
                        try{
                            workerGlobal.onerror(e);
                        }
                        catch(e){
                            // don't want an error here to go into an infinite loop!
                            workerEngine.defaultErrorReporter(e);
                        }
                    }
                    else{
                        workerEngine.defaultErrorReporter(e);
                    }
                });
            
            
            }
        }
    });
};

if(!system.__sharedWorkers__){
    system.__sharedWorkers__ = {};
}

exports.SharedWorker = function(scriptName, workerName){
    workerName = workerName || scriptName;
    var shared = system.__sharedWorkers__[workerName];
    if(!shared){
        var shared = {};
        createWorker(scriptName, function(queue, global){
            shared.queue = queue;
            shared.global = global;
            global.onconnect = true;
        });
        system.__sharedWorkers__[workerName] = shared;
    }
    var port = {};
    
    var returnPort = createPort(queue, port);
    
    createPort(shared.queue, returnPort, port);
    shared.queue.enqueue(function(){
        if(typeof shared.global.onconnect == "function"){
            shared.global.onconnect({
                port: returnPort
            });
        }
    });
    shared.num = shared.num || Math.random();
    return {port: port};
}

