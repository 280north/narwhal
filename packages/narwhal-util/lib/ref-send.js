
// Tyler Close
// Ported by Kris Kowal

/*
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 *
 * ref_send.js version: 2009-05-11
 */
"use strict";

var enqueue = require('reactor').enqueue;

/**
 * Enqueues a task to be run in a future turn.
 * @param task  function to invoke later
 */
exports.run = enqueue;

/**
 * Constructs a rejected promise.
 * @param reason    value describing the failure
 */
exports.reject =  reject;

/**
 * Constructs a promise for an immediate reference.
 * @param value immediate reference
 */
exports.ref = ref;

/**
 * Constructs a ( promise, resolver ) pair.
 *
 * The resolver is a callback to invoke with a more resolved value for
 * the promise. To fulfill the promise, simply invoke the resolver with
 * an immediate reference. To reject the promise, invoke the resolver
 * with the return from a call to reject(). To put the promise in the
 * same state as another promise, invoke the resolver with that other
 * promise.
 */
exports.defer = defer;

/**
 * Gets the current value of a promise.
 * @param value promise or immediate reference to evaluate
 */
exports.near = function (value) {
    return ('function' === typeof value) ? value() : value;
};

/**
 * Registers an observer on a promise.
 * @param value     promise or immediate reference to observe
 * @param fulfilled function to be called with the resolved value
 * @param rejected  function to be called with the rejection reason
 * @return promise for the return value from the invoked callback
 */
exports.when = function (value, fulfilled, rejected) {
    var r = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks
    forward(promise(value), 'WHEN', function (x) {
        if (done) { throw new Error(); }
        done = true;
        r.resolve(ref(x)('WHEN', fulfilled, rejected));
    }, function (reason) {
        if (done) { throw new Error(); }
        done = true;
        r.resolve(rejected ? rejected(reason) : reject(reason));
    });
    return r.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param target    promise or immediate reference for target object
 * @param noun      name of property to get
 * @return promise for the property value
 */
exports.get = function (target, noun) {
    var r = defer();
    forward(promise(target), 'GET', r.resolve, noun);
    return r.promise;
};

/**
 * Invokes a method in a future turn.
 * @param target    promise or immediate reference for target object
 * @param verb      name of method to invoke
 * @param argv      array of invocation arguments
 * @return promise for the return value
 */
exports.post = function (target, verb, argv) {
    var r = defer();
    forward(promise(target), 'POST', r.resolve, verb, argv);
    return r.promise;
};

/**
 * Sets the value of a property in a future turn.
 * @param target    promise or immediate reference for target object
 * @param noun      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
exports.put = function (target, noun, value) {
    var r = defer();
    forward(promise(target), 'PUT', r.resolve, noun, value);
    return r.promise;
};

/**
 * Deletes a property in a future turn.
 * @param target    promise or immediate reference for target object
 * @param noun      name of property to delete
 * @return promise for the return value
 */
exports.remove = function (target, noun) {
    var r = defer();
    forward(promise(target), 'DELETE', r.resolve, noun);
    return r.promise;
};

function reject(reason) {
    return function (op, arg1, arg2, arg3) {
        if (undefined === op) {
            return { '!' : reason };
        }
        if ('WHEN' === op) { return arg2 ? arg2(reason) : reject(reason); }
        return arg1 ? arg1(reject(reason)) : reject(reason);
    };
}

function ref(value) {
    if (null === value || undefined === value) {
        return reject({ $: [ 'NaO' ] });
    }
    if ('number' === typeof value && !isFinite(value)) {
        return reject({ $: [ 'NaN' ] });
    }
    return function (op, arg1, arg2, arg3) {
        if (undefined === op) { return value; }

        var r;
        switch (op) {
        case 'WHEN':
            r = value;
            break;
        case 'GET':
            r = (undefined === arg2) ? value : value[arg2];
            break;
        case 'POST':
            if (undefined === arg2) {
                r = reject({});
            } else {
                r = value[arg2](arg3);
            }
            break;
        case 'PUT':
            if (undefined === arg2) {
                r = reject({});
            } else {
                value[arg2] = arg3;
                r = {};
            }
            break;
        case 'DELETE':
            if (undefined === arg2) {
                r = reject({});
            } else {
                delete value[arg2];
                r = {};
            }
            break;
        default:
            r = reject({});
        }
        return arg1 ? arg1(r) : r;
    };
}

/**
 * Enqueues a promise operation.
 *
 * The above functions, reject() and ref(), each construct a kind of
 * promise. Other libraries can provide other kinds of promises by
 * implementing the same API. A promise is a function with signature:
 * function (op, arg1, arg2, arg3). The first argument determines the
 * interpretation of the remaining arguments. The following cases must be
 * handled:
 *
 * 'op' is undefined:
 *  Return the most resolved current value of the promise.
 *
 * 'op' is "WHEN":
 *  'arg1': callback to invoke with the fulfilled value of the promise
 *  'arg2': callback to invoke with the rejection reason for the promise
 *
 * 'op' is "GET":
 *  'arg1': callback to invoke with the value of the named property
 *  'arg2': name of the property to read
 *
 * 'op' is "POST":
 *  'arg1': callback to invoke with the return value from the invocation
 *  'arg2': name of the method to invoke
 *  'arg3': array of invocation arguments
 *
 * 'op' is "PUT":
 *  'arg1': callback to invoke with the return value from the operation
 *  'arg2': name of the property to set
 *  'arg3': new value of property
 *
 * 'op' is "DELETE":
 *  'arg1': callback to invoke with the return value from the operation
 *  'arg2': name of the property to delete
 *
 * 'op' is unrecognized:
 *  'arg1': callback to invoke with a rejected promise
 */
function forward(p, op, arg1, arg2, arg3) {
    enqueue(function () { p(op, arg1, arg2, arg3); });
}

/**
 * Gets the corresponding promise for a given reference.
 */
function promise(value) {
    return ('function' === typeof value) ? value : ref(value);
}

function defer() {
    var value;
    var pending = [];
    var tail = function (op, arg1, arg2, arg3) {
        if (undefined === op) { return pending ? tail : value(); }
        if (pending) {
            pending.push({ op: op, arg1: arg1, arg2: arg2, arg3: arg3 });
        } else {
            forward(value, op, arg1, arg2, arg3);
        }
    };
    return {
        promise: tail,
        resolve: function (p) {
            if (!pending) { return; }

            var todo = pending;
            pending = null;
            value = promise(p);

            var i, len = todo.length, task;
            for (i = 0; i < len; ++i) {
              task = todo[i];
              forward(value, task.op, task.arg1, task.arg2, task.arg3);
            }
        }
    };
}

