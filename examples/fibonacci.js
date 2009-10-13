// Adapted from https://developer.mozilla.org/En/Using_web_workers

var FILE = require("file"),
    Worker = require("worker").Worker;

var worker = new Worker(FILE.join(FILE.dirname(module.path), "fibonacci-worker.js"));  

worker.onmessage = function(event) {  
    print("Got: " + event.data);  
}

worker.onerror = function(error) {  
    print("Worker error: " + error.message);  
}

worker.postMessage(5);

// event loop
while(true) require("event-queue").nextEvent()();
