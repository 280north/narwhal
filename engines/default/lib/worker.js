
// -- kriszyp Kris Zyp

var queue = require("event-queue");
var workerEngine = require("worker-engine");

var Worker = exports.Worker = function(scriptName){
    var worker;
    createWorker(scriptName, function(workerQueue, workerGlobal){
        worker = createPort(workerQueue, workerGlobal, null, workerGlobal);
        createPort(queue, worker, workerGlobal, global);
        return worker;
    });
    return worker;
};

function createPort(queue, target, port, global){
    target.onmessage = true; // give it something to feature detect off of
    port = port || {};
            // allows for sending a message with a direct object reference.
            // this is not part of CommonJS, and must be used with great care.
    port.__enqueue__= function(eventName, args){
        queue.enqueue(function(){
            if(typeof global[eventName] == "function"){
                global[eventName].apply(target, args);
            }
        });
    };
    port.hasPendingEvents = function(){
        return queue.hasPendingEvents();
    };
    port.postMessage = function(message){
        queue.enqueue(function(){
            var event = {
                //when is supposed to be the target, and when the ports? The spec is confusing
                target: target,
                ports: [target],
                // this can be optimized to be much faster
                data: typeof message == "string" ? message : 
                    global.JSON.parse(JSON.stringify(message)),
            }
            if(typeof target.onmessage == "function"){
                target.onmessage(event);
            }
        });
    };
    return port;
}
var createEnvironment = exports.createEnvironment = function(){
    var workerGlobal = workerEngine.createEnvironment();
    
    // add the module lookup paths from our environment
    var paths = workerGlobal.require.paths;
    paths.splice(0, paths.length);
    paths.push.apply(paths, require.paths);
    
    // there must be one and only one shared worker map amongst all workers
    workerGlobal.system.__sharedWorkers__ = system.__sharedWorkers__;

	return workerGlobal;	
};
function createWorker(scriptName, setup, workerName){
    var workerQueue, 
        workerGlobal = createEnvironment();
    
    var sandbox = workerGlobal.require("narwhal/sandbox").Sandbox({
            system: workerGlobal.system,
            loader: workerGlobal.require.loader,
            modules: {
                "event-queue": workerGlobal.require("event-queue"),
                packages: workerGlobal.require("narwhal/packages")
            },
            debug: workerGlobal.require.loader.debug
        });
    // get the event queue
    workerQueue = sandbox("event-queue"); 
    
    sandbox("worker").name = workerName;
    
    // calback for dedicated and shared workers to do their thing
    var worker = setup(workerQueue, workerGlobal);
    
    workerEngine.spawn(function(){
        sandbox.main(scriptName);
        // enter the event loop
        workerQueue.enterEventLoop(function(){
	    queue.enqueue(function(){
	       if(worker && worker.onidle){
		       worker.onidle();
	       }
	    });
	});
    }, workerName || scriptName);
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
        }, workerName);
        system.__sharedWorkers__[workerName] = shared;
    }
    var port = {};
    
    var returnPort = createPort(queue, port, null, global);
    
    createPort(shared.queue, returnPort, port, shared.global);
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

