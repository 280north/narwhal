var queue = require("event-queue");

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
    var paths = workerGlobal.require.paths;
    paths.splice(0, paths.length);
    paths.push.apply(paths, require.paths);
    workerQueue = workerGlobal.require("event-queue");
    var worker = setup(workerQueue, workerGlobal);
    workerGlobal.require("system").__sharedWorkers__ = system.__sharedWorkers__;
	var thread = new java.lang.Thread(function(){
		workerGlobal.require(scriptName);
		while(true){
		    try{
			workerQueue.nextEvent()();
			if(workerQueue.isEmpty()){
			    queue.enqueue(function(){
				if(worker && worker.onidle){
					worker.onidle();
				}
			    });
			}
		    }catch(e){
		    	workerQueue.enqueue(function(){
		    		if(typeof workerGlobal.onerror === "function"){
		    			try{
		    				workerGlobal.onerror(e);
		    			}
		    			catch(e){
		    				// don't want an error here to go into an infinite loop!
		    				print(e);
		    			}
		    		}
		    		else{
		    			print(e);
		    		}
		    	});
			
			
		    }
		}
	}, "Worker thread");
	thread.start();
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
		});
		system.__sharedWorkers__[workerName] = shared;
	}
	var port = {};
	var returnPort = createPort(queue, port);
	createPort(shared.queue, returnPort, port);
	shared.global.onconnect = true;
	shared.queue.enqueue(function(){
		if(typeof shared.global.onconnect == "function"){
			shared.global.onconnect({
				port: port
			});
		}
	});
	return {port: port};
}

