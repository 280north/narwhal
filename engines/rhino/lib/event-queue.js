/**
* Represents the event queue for a vat
*/

// we could eventually upgrade to PriorityBlockingQueye with FIFOEntry tie breaking
var queue = new java.util.concurrent.LinkedBlockingQueue();

exports.nextEvent = function(){
    return queue.take();
};

exports.enqueue = function(task, priority){
    queue.put(task); // priority is ignored for now until PriorityBlockingQueue is used
};

exports.isEmpty = function(){
    return queue.isEmpty();    
}