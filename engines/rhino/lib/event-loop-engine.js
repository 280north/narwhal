
// -- kriszyp Kris Zyp

/**
 * Represents the event queue for a vat
 * The API is modeled after https://developer.mozilla.org/en/nsIThread
 */

// we could eventually upgrade to PriorityBlockingQueye with FIFOEntry tie breaking
var loopLevel = 0,
    shuttingDown, 
    queue = new java.util.concurrent.LinkedBlockingQueue();

require("event-loop-hook").when(function () {
    if (exports.hasPendingEvents())
        exports.enterEventLoop(function () {
            exports.shutdown();
        });
});

exports.getNextEvent = function(){
    return queue.take();
};

exports.processNextEvent = function(mayWait){
    if(!mayWait && queue.isEmpty()){
        return false;
    }
    try{
        var next = queue.take();
        next();
    }catch(e){
        exports.enqueue(function(){
            if(typeof onerror === "function"){
                // trigger the onerror event in the worker if an error occurs
                try{
                    onerror(e);
                }
                catch(e){
                    // don't want an error here to go into an infinite loop!
                    exports.defaultErrorReporter(e);
                }
            }
            else{
                exports.defaultErrorReporter(e);
            }
        });


    }
    return true;
};

exports.enterEventLoop = function(onidle){
    shuttingDown = false;
    loopLevel++;
    var currentLoopLevel = loopLevel;
    while(true){

        if (queue.isEmpty()) {
            // fire onidle events if a callback is provided
            if (onidle) {
                onidle();
            }
            if(shuttingDown){
                return;
            }
        }
        if (loopLevel < currentLoopLevel) {
            return;
        }

        exports.processNextEvent(true);

    }

};

exports.enqueue = function(task, priority){
    if(loopLevel > -1){
        queue.put(task); // priority is ignored for now until PriorityBlockingQueue is used
    }
};

exports.hasPendingEvents = function(){
    return !queue.isEmpty();    
}

// based on Node's process.unloop();
exports.unloop = function(){
    loopLevel--;
};

exports.shutdown = function(){
    shuttingDown = true;
    if(queue.isEmpty()){
        // if it is empty we need to kick start the event loop to make sure we get into the
        // the check for shuttingDown
        exports.enqueue(function(){});
    }
};

exports.defaultErrorReporter = function(e){
    print((e.rhinoException && e.rhinoException.printStackTrace()) || (e.name + ": " + e.message));
};

