// this is based on the CommonJS spec for promises: 
// http://wiki.commonjs.org/wiki/Promises

// A typical usage:
// A default Promise constructor can be used to create a self-resolving promise:
// var Promise = require("promise").Promise;
//    var promise = new Promise();
// asyncOperation(function(){
//    Promise.resolve("succesful result");
// });
//    promise -> given to the consumer
//  
//    A consumer can use the promise
//    promise.then(function(result){
//        ... when the action is complete this is executed ...
//   },
//   function(error){
//        ... executed when the promise fails
//  });
//
// Alternately, a provider can create a deferred and resolve it when it completes an action. 
// The deferred object provides a separation of consumer and producer to protect
// promises from being fulfilled by untrusted code.
// var defer = require("promise").defer;
//    var deferred = defer();
// asyncOperation(function(){
//    deferred.resolve("succesful result");
// });
//    deferred.promise -> given to the consumer
//  
//    Another way that a consumer can use the promise (using promise.then is also allowed)
// var when = require("promise").when;
// when(promise,function(result){
//        ... when the action is complete this is executed ...
//   },
//   function(error){
//        ... executed when the promise fails
//  });
try{
    var queue = require("event-queue");
}
catch(e){
    // squelch the error, and only complain if the queue is needed
}

/**
 * Default constructor that creates a self-resolving Promise. Not all promise implementations
 * need to use this constructor.
 */
var Promise = exports.Promise = function(canceller){
    // make a deferred and copy everything to its promise so it can be self-resolving
    var deferred = new Deferred();
    var promise = deferred.promise;
    for(var i in deferred){
        promise[i] = deferred[i];
    }
    if(canceller){
        promise.cancel = function(){
            var error = canceller();
            if(!(error instanceof Error)){
                error = new Error(error);
            }
            promise.reject(error);
        }
    }
    return promise;
};

/**
 * Promise implementations must provide a "then" function.
 */
Promise.prototype.then = function(resolvedCallback, errorCallback, progressCallback){
    throw new TypeError("The Promise base class is abstract, this function must be implemented by the Promise implementation");
};

/**
 * If an implementation of a promise supports a concurrency model that allows
 * execution to block until the promise is resolved, the wait function may be 
 * added. 
 */
/**
 * If an implementation of a promise can be cancelled, it may add this function
 */
 // Promise.prototype.cancel = function(){
 // };

Promise.prototype.get = function(propertyName){
    return this.then(function(value){
        return value[propertyName];
    });
};

Promise.prototype.put = function(propertyName, value){
    return this.then(function(object){
        return object[propertyName] = value;
    });
};

Promise.prototype.call = function(functionName /*, args */){
    return this.then(function(value){
        return value[propertyName].apply(value, Array.prototype.slice.call(arguments, 1));
    });
};

// if an error is not handled within 5 seconds then it should be reported
var errorHandledTimeout = 5000; 
function DeferredPromise(){
}
DeferredPromise.prototype = Promise.prototype; 
// A deferred provides an API for creating and resolveing a promise.
exports.defer = function(canceller){
    return new Deferred(canceller);
} 
function Deferred(){
    var result, finished, isError, waiting = [], handled, errorTimeout;
    var promise = this.promise = new DeferredPromise();
    
    function notifyAll(value){
        if(queue){
            // if we have an event queue, we will enqueue it
            queue.enqueue(doNotify);    
        }
        else{
            doNotify();
        }
        
        function doNotify(){
            if(finished){
                throw new Error("This deferred has already been resolved");                
            }
            result = value;
            finished = true;
            for(var i = 0; i < waiting.length; i++){
                notify(waiting[i]);    
            }
        }
    }
    function notify(listener){
        var func = (isError ? listener.error : listener.resolved);
        try{
            if(func){
                handled = true;
                if(typeof errorTimeout == "number"){
                    clearTimeout(errorTimeout);
                }
                var newResult = func(result);
            }
            if(newResult && typeof newResult.then === "function"){
                newResult.then(function(result){
                        listener.deferred.resolve(result);
                    },
                    function(error){
                        listener.deferred.reject(error);
                    });
            }
            else{
                listener.deferred.resolve(newResult === undefined ? result : newResult);
            }
        }
        catch(e){
            listener.deferred.reject(e);
        } 
    }
    // calling resolve will resolve the promise
    this.resolve = function(value){
        notifyAll(value);
    };
    // calling error will indicate that the promise failed
    var errback = this.reject = function(error){
        isError = true;
        notifyAll(error);
        if(typeof setTimeout != "undefined" && !handled){
            errorTimeout = setTimeout(function(){
                throw error;
            }, errorHandledTimeout);
        }
    }
    // call progress to provide updates on the progress on the completion of the promise
    this.progress = function(update){
        for(var i = 0; i < waiting.length; i++){
            var progress = waiting[i].progress;
            progress && progress(update);    
        }
    }
    // provide the implementation of the promise
    promise.then = function(resolvedCallback, errorCallback, progressCallback){
        var returnDeferred = new Deferred();
        var listener = {resolved: resolvedCallback, error: errorCallback, progress: progressCallback, deferred: returnDeferred}; 
        if(finished){
            notify(listener);
        }
        else{
            waiting.push(listener);
        }
        return returnDeferred.promise;
    };
};

function perform(value, async, sync, promiseNotNeeded){
    try{
        if(value && typeof value.then === "function"){
            value = async(value);
        }
        else{
            value = sync(value);
        }
        if(value && typeof value.then === "function"){
            return value;
        }
        if(promiseNotNeeded){
            return value;
        }
        var deferred = new Deferred();
        deferred.resolve(value);
        return deferred.promise;
    }catch(e){
        if(promiseNotNeeded){
            throw e;
        }
        var deferred = new Deferred();
        deferred.reject(e);
        return deferred.promise;
    }
    
}
/**
 * Promise manager to make it easier to consume promises
 */
 
/**
 * Registers an observer on a promise.
 * @param value     promise or value to observe
 * @param resolvedCallback function to be called with the resolved value
 * @param rejectCallback  function to be called with the rejection reason
 * @param progressCallback  function to be called when progress is made
 * @return promise for the return value from the invoked callback
 */
exports.when = function(value, resolvedCallback, rejectCallback, progressCallback){
    return perform(value, function(value){
        return value.then(resolvedCallback, rejectCallback, progressCallback);
    },
    function(value){
        return resolvedCallback(value);
    });
};
/**
 * Registers an observer on a promise.
 * @param value     promise or value to observe
 * @param resolvedCallback function to be called with the resolved value
 * @param rejectCallback  function to be called with the rejection reason
 * @param progressCallback  function to be called when progress is made
 * @return promise for the return value from the invoked callback or the value if it
 * is a non-promise value
 */
exports.whenPreservingType = function(value, resolvedCallback, rejectCallback, progressCallback){
    return perform(value, function(value){
        return value.then(resolvedCallback, rejectCallback, progressCallback);
    },
    function(value){
        return resolvedCallback(value);
    }, true);
};

/**
 * Gets the value of a property in a future turn.
 * @param target    promise or value for target object
 * @param property      name of property to get
 * @return promise for the property value
 */
exports.get = function(target, property){
    return perform(target, function(target){
        return target.get(property);
    },
    function(target){
        return target[property]
    });
};

/**
 * Invokes a method in a future turn.
 * @param target    promise or value for target object
 * @param methodName      name of method to invoke
 * @param args      array of invocation arguments
 * @return promise for the return value
 */
exports.post = function(target, methodName, args){
    return perform(target, function(target){
        return target.call(property, args);
    },
    function(target){
        return target[methodName].apply(target, args);
    });
};

/**
 * Sets the value of a property in a future turn.
 * @param target    promise or value for target object
 * @param property      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
exports.put = function(target, property, value){
    return perform(target, function(target){
        return target.put(property, value);
    },
    function(target){
        return target[property] = value;
    });
};


/**
 * Waits for the given promise to finish, blocking (and executing other events)
 * if necessary to wait for the promise to finish. If target is not a promise
 * it will return the target immediately. If the promise results in an reject,
 * that reject will be thrown.
 * @param target   promise or value to wait for.
 * @return the value of the promise;
 */
exports.wait = function(target){
    if(!queue){
        throw new Error("Can not wait, the event-queue module is not available");
    }
    if(target && typeof target.then === "function"){
        var isFinished, isError, result;        
        target.then(function(value){
            isFinished = true;
            result = value;
        },
        function(error){
            isFinished = true;
            isError = true;
            result = error;
        });
        while(!isFinished){
            try{
                queue.nextEvent()();
            }catch(e){
                print(e);
            }
        }
        if(isError){
            throw result;
        }
        return result;
    }
    else{
        return target;
    }
};


