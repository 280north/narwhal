
// Tyler Close
// Ported by Kris Kowal
// Variation to illustrated ideas for improvements on the API.
// * Deferred, Rejection, Reference instead of defer, reject, ref, and promise.
// * Promise constructor that takes a descriptor and fallback.
// * near has been changed to valueOf, and uses a valueOf operator instead
//   an undefined operator, to reduce special cases.
// * variadic arguments are used internally where applicable (POST arguments
//   have not yet been altered.

/*
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 *
 * ref_send.js version: 2009-05-11
 */

// - the enclosure ensures that this module will function properly both as a
// CommonJS module and as a script in the browser.  In CommonJS, this module
// exports the "Q" API.  In the browser, this script creates a "Q" object in
// global scope.
// - the use of "undefined" on the enclosure is a micro-optmization for
// compression systems, permitting every occurrence of the "undefined" keyword
// bo be replaced with a single-character.
(function (exports, undefined) {
"use strict";

// this provides an enqueue method in browsers, Narwhal, and NodeJS
var enqueue;
if (typeof setTimeout === "function") {
    enqueue = function (task) {
        setTimeout(task, 0);
    };
} else {
    enqueue = require("event-loop").enqueue;
}

/**
 * Enqueues a task to be run in a future turn.
 * @param task function to invoke later
 */
exports.enqueue = enqueue;

/**
 * Constructs a {promise, resolve} object.
 *
 * The resolver is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke the resolver with any value that is
 * not a function. To reject the promise, invoke the resolver with a Rejection
 * object. To put the promise in the same state as another promise, invoke the
 * resolver with that other promise.
 */
exports.Deferred = Deferred;

function Deferred() {
    // if "pending" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the pending array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the Reference Promise because it handles both fully
    // resolved values and other promises gracefully.
    var pending = [], value;
    return {
        "promise": seal(function () {
            var args = Array.prototype.slice.call(arguments);
            if (pending) {
                pending.push(args);
            } else {
                forward.apply(undefined, [value].concat(args));
            }
        }),
        "resolve": function (resolvedValue) {
            var i, ii, task;
            if (!pending) 
                return;
            value = Reference(resolvedValue);
            for (i = 0, ii = pending.length; i < ii; ++i) {
                forward.apply(undefined, [value].concat(pending[i]));
            }
            pending = undefined;
        }
    };
}

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * put(name, value), post(name, args), delete(name), and valueOf(), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
exports.Promise = Promise;

function Promise(descriptor, fallback) {

    if (fallback === undefined) {
        fallback = function (op) {
            return Rejection("Promise does not support operation: " + op);
        };
    }

    var promise = seal(function (op, resolved /* ...args */) {
        var args = Array.prototype.slice.call(arguments, 2);
        var result;
        if (descriptor[op])
            result = descriptor[op].apply(descriptor, args);
        else
            result = fallback.apply(descriptor, arguments);
        if (resolved)
            return resolved(result);
        return result;
    });

    promise.toSource = promise.toString = function () {
        return '[object Promise]';
    };

    promise.valueOf = function () {
        return unseal(promise)("valueOf");
    };

    return promise;
};


/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
exports.Rejection = Rejection;

function Rejection(reason) {
    return Promise({
        "when": function (rejected) {
            return rejected ? rejected(reason) : Rejection(reason);
        }
    }, function fallback(op, resolved) {
        var rejection = Rejection(reason);
        return resolved ? resolved(rejection) : rejection;
    });
}

/**
 * Constructs a promise for an immediate reference.
 * @param value immediate reference
 */
exports.Reference = Reference;

function Reference(object) {
    // If the object is already a Promise, return it directly.  This enables
    // the Reference function to both be used to created references from
    // objects, but to tolerably coerce non-promises to References if they are
    // not already Promises.
    if (typeof object === "function")
        return object;
    return Promise({
        "when": function (rejected) {
            return object;
        },
        "get": function (name) {
            return object[name];
        },
        "put": function (name, value) {
            object[name] = value;
        },
        "delete": function (name) {
            delete object[name];
        },
        "post": function (name, args) {
            return object[name].apply(object, args);
        },
        "valueOf": function () {
            return object;
        }
    });
}

/**
 * Constructs a promise method that can be used to safely observe resolution of
 * a promise for an arbitrarily named method like "propfind" in a future turn.
 *
 * "Method" constructs methods like "get(promise, name)" and "put(promise)".
 */
exports.Method = Method;
function Method (methodName) {
    return function (object) {
        var deferred = Deferred();
        var args = Array.prototype.slice.call(arguments, 1);
        forward.apply(undefined, [
            Reference(object),
            methodName,
            deferred.resolve
        ].concat(args));
        return deferred.promise;
    };
}

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that resolved and rejected will be called only once.
 * 2. that either the resolved callback or the rejected callback will be
 *    called, but not both.
 * 3. that resolved and rejected will not be called in this turn.
 *
 * @param value     promise or immediate reference to observe
 * @param resolve function to be called with the resolved value
 * @param rejected  function to be called with the rejection reason
 * @return promise for the return value from the invoked callback
 */
exports.when = function (value, resolved, rejected) {
    var deferred = Deferred();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks
    forward(Reference(value), "when", function (value) {
        if (done) 
            throw new Error("A promise just attempted to resolve again");
        done = true;
        deferred.resolve(unseal(Reference(value))("when", resolved, rejected));
    }, function (reason) {
        if (done) 
            throw new Error("A promise just attempted to resolve again");
        done = true;
        deferred.resolve(rejected ? rejected(reason) : Rejection(reason));
    });
    return deferred.promise;
};

exports.asap = function (value, resolved, rejected) {
    var deferred = Deferred();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks
    unseal(Reference(value))("when", function (value) {
        if (done) 
            throw new Error("A promise just attempted to resolve again");
        done = true;
        deferred.resolve(unseal(Reference(value))("when", resolved, rejected));
    }, function (reason) {
        if (done)
            throw new Error("A promise just attempted to resolve again");
        done = true;
        deferred.resolve(rejected ? rejected(reason) : Rejection(reason));
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
exports.get = Method("get");

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param argv      array of invocation arguments
 * @return promise for the return value
 */
exports.post = Method("post");

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
exports.put = Method("put");

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
exports.del = Method("del");

/**
 * Guarantees that the give promise resolves to a defined, non-null value.
 */
exports.defined = function (value) {
    return exports.when(value, function (value) {
        if (value === undefined || value === null)
            return Rejection("Resolved undefined value: " + value);
        return value;
    });
};

/**
 * Enqueues a promise operation for a future turn.
 */
function forward(promise /*, op, resolved, ... */) {
    var args = Array.prototype.slice.call(arguments, 1);
    enqueue(function () {
        unseal(promise).apply(undefined, args);
    });
}

/**
 * seal(value) returns an object that can be passed to a third party and back
 * to this API without giving the third party access to the value.  The only
 * way to get the value out of the sealed value is to call unseal(sealed),
 * which is only accessible within this closure.  This is an application of
 * Marc Stiegler's [seal, unseal] pairs.
 */

var secret;

function seal(value) {
    return function () {
        if (secret)
            return value;
        else
            throw new Error("Value is sealed.");
    };
}

function unseal(sealed) {
    try {
        secret = true;
        return sealed();
    } finally {
        secret = false;
    }
}

// Complete the closure: use either CommonJS exports or browser global Q object
// for the exports internally.
})(
    typeof exports !== "undefined" ?
    exports :
    Q = {}
);

