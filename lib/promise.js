// this is based on the CommonJS spec for promises: 
// http://wiki.commonjs.org/wiki/Promises

// A typical usage:
//	A provider will create a future and fulfill when it completes an action
// var Future = require("promise").Future;
//	var future = new Future();
// asyncOperation(function(){
//    future.fulfill("succesful result");
// });
//	future.promise -> given to the consume
//  
//	A consumer can use the promise
//	promise.then(function(result){
//		... when the action is complete this is executed ...
//   },
//   function(error){
//	    ... executed when the promise fails
//  });

var Promise = exports.Promise = function(){
};

Promise.prototype.then = function(fulfilledCallback, errorCallback, progressCallback){
	throw new TypeError("The Promise base class is abstract, this function must be implemented by the Promise implementation");
};

/**
 * If an implementation of a promise supports a concurrency model that allows
 * execution to block until the promise is fulfilled, the wait function may be 
 * added. 
 */
// Promise.prototype.wait = function(){
// };

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


// A future provides an API for creating and fulfilling a promise.
var Future = exports.Future = function(){
	var result, finished, isError, waiting = [];
	var promise = this.promise = new Promise();
	
	function notifyAll(value){
		if(finished){
			throw new Error("This future has already been fulfilled");				
		}
		result = value;
		finished = true;
		for(var i = 0; i < waiting.length; i++){
			notify(waiting[i]);	
		}
	}
	function notify(listener){
		var func = (isError ? listener.error : listener.fulfilled);
		try{
			var newResult = func && func(result);
			if(newResult instanceof Promise){
				newResult.then(function(result){
						listener.future.fulfill(result);
					},
					function(error){
						listener.future.error(error);
					});
			}
			else{
				listener.future.fulfill(newResult === undefined ? result : newResult);
			}
		}
		catch(e){
			listener.future.error(e);
		} 
	}
	// calling fulfill will fulfill the promise
	this.fulfill = function(value){
		notifyAll(value);
	};
	// calling error will indicate that the promise failed
	this.error = function(error){
		isError = true;
		notifyAll(error);
	}
	// call progress to provide updates on the progress on the completion of the promise
	this.progress = function(update){
		for(var i = 0; i < waiting.length; i++){
			var progress = waiting[i].progress;
			progress && progress(update);	
		}
	}
	// provide the implementation of the promise
	promise.then = function(fulfilledCallback, errorCallback, progressCallback){
		var returnFuture = new Future();
		var listener = {fulfilled: fulfilledCallback, error: errorCallback, progress: progressCallback, future: returnFuture}; 
		if(finished){
			notify(listener);
		}
		else{
			waiting.push(listener);
		}
		return returnFuture.promise;
	};
};

function perform(async, sync, promiseNotNeeded){
	try{
		if(value instanceof Promise){
			value = async(value);
		}
		else{
			value = sync(value);
		}
		if(value instanceof Promise){
			return value;
		}
		if(promiseNotNeeded){
			return value;
		}
		var future = new Future();
		future.fulfill(value);
		return future.promise;
	}catch(e){
		if(promiseNotNeeded){
			throw e;
		}
		var future = new Future();
		future.error(e);
		return future.promise;
	}
	
}
/**
 * Promise manager to make it easier to consume promises
 */
 
/**
 * Registers an observer on a promise.
 * @param value     promise or immediate reference to observe
 * @param fulfilledCallback function to be called with the resolved value
 * @param errorCallback  function to be called with the rejection reason
 * @param progressCallback  function to be called when progress is made
 * @return promise for the return value from the invoked callback
 */
exports.when = function(value, fulfilledCallback, errorCallback, progressCallback){
	return perform(function(value){
		return value.then(fulfilledCallback, errorCallback, progressCallback);
	},
	function(value){
		return fulfilledCallback(value);
	});
};
/**
 * Registers an observer on a promise.
 * @param value     promise or immediate reference to observe
 * @param fulfilledCallback function to be called with the resolved value
 * @param errorCallback  function to be called with the rejection reason
 * @param progressCallback  function to be called when progress is made
 * @return promise for the return value from the invoked callback or the value if it
 * is a non-promise value
 */
exports.whenPreservingType = function(value, fulfilledCallback, errorCallback, progressCallback){
	return perform(function(value){
		return value.then(fulfilledCallback, errorCallback, progressCallback);
	},
	function(value){
		return fulfilledCallback(value);
	}, true);
};

/**
 * Gets the value of a property in a future turn.
 * @param target    promise or immediate reference for target object
 * @param property      name of property to get
 * @return promise for the property value
 */
exports.get = function(target, property){
	return perform(function(target){
		return target.get(property);
	},
	function(target){
		return target[property]
	});
};

/**
 * Invokes a method in a future turn.
 * @param target    promise or immediate reference for target object
 * @param methodName      name of method to invoke
 * @param args      array of invocation arguments
 * @return promise for the return value
 */
exports.post = function(target, methodName, args){
	return perform(function(target){
		return target.call(property, args);
	},
	function(target){
		return target[methodName].apply(target, args);
	});
};

/**
 * Sets the value of a property in a future turn.
 * @param target    promise or immediate reference for target object
 * @param property      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
exports.put = function(target, property, value){
	return perform(function(target){
		return target.put(property, value);
	},
	function(target){
		return target[property] = value;
	});
};