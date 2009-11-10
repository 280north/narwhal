/**
* Represents the event queue for a vat
* The API is modeled after https://developer.mozilla.org/en/nsIThread
*/

// we could eventually upgrade to PriorityBlockingQueye with FIFOEntry tie breaking
var shuttingDown, 
    queue = new java.util.concurrent.LinkedBlockingQueue();
    

exports.getNextEvent = function(){
    return queue.take();
};

exports.processNextEvent = function(mayWait){
    if(!mayWait && queue.isEmpty()){
        return false;
    }
    try{
        queue.take()();
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
    while(true){
        exports.processNextEvent(true);

        if(queue.isEmpty()){
            if(shuttingDown){
                return;
            }
            // fire onidle events if a callback is provided
            if(onidle){
                onidle();
            }
        }
    }

};

exports.enqueue = function(task, priority){
    if(!shuttingDown){
        queue.put(task); // priority is ignored for now until PriorityBlockingQueue is used
    }
};

exports.hasPendingEvents = function(){
    return !queue.isEmpty();    
}

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