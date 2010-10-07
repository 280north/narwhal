"use strict";

// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- kriszyp Kris Zyp

/*

    Basic events, signals, emitters, observers, observables,
    deferreds, and promises.

    Typical usage:

        var Q = require("narwhal/promise");
        var {promise, resolve, reject} = Q.defer();
        asyncOperation(function () {
            try {
                resolve("ok result");
            } catch (exception) {
                reject(exception);
            }
        });
        return promise;

        // meanwhile...

        Q.when(promise, function (value) {
            print("ok " + value);
        });

    Optionally accepts an errback and progress notifier:

        Q.when(promise, function (value) {
            print("ok " + value);
        }, function (error) {
            print("error " + value);
        }, function (progress) {
            print("progress " + progress.toFixed(1) + "%");
        });

    Object-oriented variation:

        // "then" and "when" are both acceptable
        promise.then(function (value) {
            print("ok " + value);
        });

    Using event emitters:

        deferred.observe("ok", function (value) { });
        deferred.observe("error", function (value) { });
        deferred.observe("cancel", function (value) { });
        deferred.observe("progress", function (progress) { });

        promise.observe("ok", function (value) { });
        promise.observe("error", function (value) { });
        promise.observe("cancel", function (value) { });
        promise.observe("progress", function (progress) { });

    Continued deferrence works:

        var resolution = Q.when(async1(), function () {
            return Q.when(async2(), function () {
                return Q.when(async3(), function () {
                    return resolution;
                };
            });
        });

        Q.when(resolution, function () {
            print(resolution);
        });

*/

// Authors and their contributions:

// Tyler Close
//   Waterken

// Built on the shoulders of Tyler Close's Waterken "ref_send" API,
// with some chance of falling short.  Instead of a purely
// functional API, where a promise is a function that takes a method
// name as its first argument, "Promise" is a JavaScript type that
// implements an "emit" method, analogous to "ref_send's" internal
// "forward" method.  The "emit" method comes from an event
// "Emitter" base type, inspired by "Node" and Chiron's
// "Observable/Signaler" events system.  The "emit" method emits an
// event to the corresponding method, if it exists.  As in
// "ref_send", "Promise" is a duck-type so different varieties and
// extensions to the "Promise" API are possible in user-land.
//
// Also, to take advantage of JavaScript native facilities, the
// function for grabbing a "near" value from a "Reference" promise
// object is "valueOf()".

// Distinct in this implementation, the concern of how to implement
// the event loop has been separated into an external module.  The
// implementation of this module necessarily varries across engines.

// Unlike "ref_send" originally, "undefined" is an acceptable value
// for a resolved promise reference.  This permits the natural use
// of promises for events that have no meaningful value, like the
// DOM's "DOM ready" event which would be better represented as a
// promise since observers of the "event" after the fact should have
// a signal emitted immediately.

// -- kriszyp Kris Zyp

// Based on the CommonJS spec for promises,
// http://wiki.commonjs.org/wiki/Promises
// and the Dojo Deferred API.

// While Deferreds are compatible with the Dojo API, internally they
// are a "ref_send" "promise", "resolver" pair.  For security
// purposes, you must return only the "promise" component of the
// "Deferred" to suspicious callers, and it's recommended that all
// API's make a habbit of returning only the "promise".  The parts
// of the Deferred API that are relevant for promise consumers are
// hosted on both the "Deferred" object and the "Promise" object but
// are the sole responsibility of the "Promise".  All the parts of
// the Deferred API that are relevant for resolving a promise are
// only on the Deferred object.

// ryah Ryan Dahl
//   NodeJS

// EventEmitter, Promise.  NodeJS's Promise API resembles the Dojo
// API but are called Promises.  Ryan also provided a critcal insight
// that a Promise or Deferred could be implemented in terms of
// an event emitter framework.

// kriskowal Kris Kowal Copyright 2009-2010 MIT License
//   Narwhal, Chiron

// Carrying Ryan Dahl's epiphany to its logical conclusion, I've
// ported Chiron's "events" module, which includes base types for
// events, signals, emitters, observers, an observable method type.
// It is suitable for hosting DOM-style events, where signals have
// an intrinsic "default" action that can be cancelled, and can
// propagate but be stopped.  Chiron had a "Signaler" type, which
// I've renamed "Emitter" to converge with NodeJS.

// Depends on ES5 Object.create and Object.freeze.

var Q = exports;

Q.enqueue = require("event-loop").enqueue;

/**
 * An activation object for event observers that permits an observer to affect
 * whether the an event continues to propagate to other observers and whether
 * the emitting signal completes its default action.
 */

Q.Event = function () {
    var self = Object.create(Q.Event.prototype);
    Q.Event.constructor.call(self);
    return Object.freeze(Object.create(self));
};

Q.Event.constructor = Object.freeze(function () {
    var self = this;

    var propagation = true;
    var defaulting = true;

    /**
     * prevents further propagation and the default action of the emitting
     * signal.
     */
    self.stop = Object.freeze(function () {
        self.stopPropagation();
        self.cancelDefault();
    });

    /**
     * prevents further propagation of the emitting signal
     */
    self.stopPropagation = Object.freeze(function () {
        propagation = false;
    });

    /**
     * prevents the default action of the emitting signal.
     */
    self.cancelDefault = Object.freeze(function () {
        defaulting = false;
    });

    /**
     * @returns {Boolean} whether this event instructs the emitting signal to
     * continue propagating to further observers.
     */
    self.getPropagation = Object.freeze(function () {
        return propagation;
    });

    /**
     * @returns {Boolean} whether this event instructs the emitting signal to
     * apply its default action.
     */
    self.getDefaulting = Object.freeze(function () {
        return defaulting;
    });

});

Object.freeze(Q.Event);
Object.freeze(Q.Event.prototype);

/** Signal
 * base prototype for a signal that emits events.
 */

Q.Signal = function (action, Event) {
    var self = Object.create(Q.Signal.prototype);
    Q.Signal.constructor.call(self, action, Event);
    return Object.freeze(Object.create(self));
};

Q.Signal.constructor = Object.freeze(function (action, Event) {
    var self = this;

    var waiting = [];
    if (!Event)
        Event = Q.Event;

    /**
     * arranges for a given observer function to be called whenever
     * this signal is emitted.  The calling of this observer
     * function can in turn be observed by the returned signal.
     *
     * @param observer {Function} a function to call when this
     * signal is emitted.  All observers get called before the
     * signal's "default action", if it has one.  Observers are
     * called on a first-come, first-served basis.
     * @param Event {Event type} an optional Event type to be used
     * for the returned Signal that defaults to Event.
     * @returns a Signal that is emitted before the given observer.
     */
    self.addListener = // NodeJS
    self.observe = Object.freeze(function (observer, Event) {
        var signal = Q.Signal(observer, Event);
        waiting.push(signal.emitter());
        return signal;
    });

    // XXX may be deprecated in the future in favor of a more secure or safe
    // system for cancelling a signal.
    self.removeListener = // NodeJS
    self.dismiss = Object.freeze(function (observer) {
        var offset = waiting.indexOf(observer);
        if (offset < 0)
            return;
        waiting.splice(offset, 1);
    });

    /**
     * emits an event with to all observers and the signal's default action, by
     * applying each function with the event instance as the activation object
     * and the forwarding the given arguments.  Uses the event object to
     * determine whether to continue propagating from observer to the next, and
     * whether to apply the default action.
     */
    self.emit = Object.freeze(function () {

        var event;
        if (this instanceof Event) {
            event = this;
        } else {
            event = Q.Event();
        }

        /* emit signals to observers with an Event as the activation
         * object. */
        for (var i = 0, ii = waiting.length; i < ii; i++) {
            var observer = waiting[i];
            if (!event.getPropagation())
                break;
            observer.apply(event, arguments);
        }

        /* call the "default" action function */
        if (action && event.getDefaulting()) {
            return action.apply(event, arguments);
        }

    });

    /**
     * @returns a function that, when called with
     * arbitrary arguments, arranges for the signal
     * to be observed with a given function that receives
     * those arguments.
     *
     * > var x = signal.observer(function (y, z) {
     * >     print("signal was observed with " + y + ", " + z);
     * > });
     * > x("a", 10);
     * > x("b", 20);
     * > x.emit();
     * signal was observed with a, 10
     * signal was observed with b, 20
     *
     */
    self.observer = Object.freeze(function (observer, Event) {
        var that = this;
        return function () {
            var args = arguments;
            self.observe(function () {
                observer.apply(that, args);
            }, Event);
        };
    });

    /**
     * @returns {Function} a function that emits this signal when it is called.
     */
    self.emitter = Object.freeze(function () {
        return Object.freeze(function () {
            return self.emit.apply(this, arguments);
        });
    });

    /**
     * @returns {Array} all observer functions in order.  Modifications to the
     * returned array will not affect the behavior of the signal.
     */
    // required to implement NodeJS's promise.listeners()
    self.getObservers = Object.freeze(function () {
        return Array.prototype.slice.call(waiting);
    });

});

Object.freeze(Q.Signal);
Object.freeze(Q.Signal.prototype);

/** Emitter
 * base prototype for objects with observable, named, event signals.
 */

Q.EventEmitter = // NodeJS
Q.Emitter = function () {
    var self = Object.create(Q.Emitter.prototype);
    Q.Emitter.constructor.call(this);
    return Object.freeze(Object.create(self));
};

Q.Emitter.constructor = Object.freeze(function () {
    var self = this;

    var signals = {};

    self.constructObservable = Object.freeze(function (observable) {
        observable.addListener = // NodeJS
        observable.observe = function (name, observer) {
            return self.getSignal(name).observe(observer);
        };
    });

    var observable = Object.create(Q.Observable.prototype);
    self.constructObservable(observable);

    self.observable = Object.freeze(Object.create(observable));

    /**
     * emits an event to all observers of signal with a particular name.
     * Further arguments are applied to each observer.
     * @param name {String} the name of the signal to emit.
     */
    self.emit = Object.freeze(function (name /* ...args */) {
        var args = Array.prototype.slice.call(arguments, 1);
        var signal = self.getSignal(name);
        return signal.emit.apply(signal, args);
    });

    /**
     * adds an observer to this object's signal for a given name.
     * @param name {String} the name of the signal to observe.
     */
    self.addListener = // NodeJS
    self.observe = Object.freeze(function (name, observer) {
        return self.getSignal(name).observe(observer);
    });

    /**
     * removes an observer from this object's signal for a given name.
     * @param name {String}
     * @param observer {Function}
     */
    self.removeListener = // NodeJS
    self.dismiss = Object.freeze(function (name, observer) {
        self.getSignal(name).dismiss(observer);
    });

    self.listeners = // NodeJS
    self.getObservers = Object.freeze(function (name) {
        return self.getSignal(name).getObservers();
    });

    /**
     * adds a Signal slot to this event emitter with a given name.
     * @param name {String} the name of the signal slot.  Only one
     * signal can be created for each name.
     * @param signal an optional function or Signal object
     * @param Event an optional event type that will be instantiated and passed
     * as the activation object to each observer each time the signal emits an
     * event.
     * @returns a signal, albeit one wrapped around the given function.
     */
    self.setSignal = Object.freeze(function (name, signal, Event) {
        if (!(signal instanceof Q.Signal))
            signal = Q.Signal(signal, Event);
        signals[name] = signal;
        return signal;
    });

    /**
     * returns the Signal for a given name.  Throws an error if
     * no signal has been slotted by the given name.
     * @param name {String} name of the signal to get.
     * @returns {Signal}
     */
    self.getSignal = Object.freeze(function (name) {
        if (!Object.prototype.hasOwnProperty.call(signals, name))
            throw new Error("No such signal: " + name);
        return signals[name];
    });

    /**
     * @returns {boolean} whether a Signal has been registered for the given
     * name.
     */
    self.hasSignal = Object.freeze(function (name) {
        return Object.prototype.hasOwnProperty.call(signals, name);
    });

});

Object.freeze(Q.Emitter);
Object.freeze(Q.Emitter.prototype);

/** Observable < Emitter
 * a mixin type for any object that can emit events when certain property
 * functions are called.
 */

Q.Observable = function () {
    var self = Object.create(Q.Observable.prototype);
    Q.Observable.constructor.call(self);
    return Object.freeze(Object.create(self));
};

Q.Observable.constructor = Object.freeze(function () {
    var self = this;

    Q.Emitter.constructor.call(self);

    /**
     * sets a signal using the Emitter system, bypassing the Observable's
     * setSignal behavior of adding the emitter as a property of the instance.
     */
    self.setSignalRaw = self.setSignal;

    /**
     * adds a signal slot for the given name and sets it to a property of the
     * activation object (this).  This property function should only be called
     * during the process of constructing this instance.
     */
    self.setSignal = Object.freeze(function (name, observer, Event) {
        var x;
        self[name] = x = self.setSignalRaw(name, observer, Event).emitter();
        if (x !== self[name])
        throw new Error("self[name] = failed silently");

    });

    // "observe" is observable.
    self.setSignal("observe", function (name, observer) {
        return self.getSignal(name).observe(observer);
    });

});

Q.Observable.prototype = Object.create(Q.Emitter.prototype);

Object.freeze(Q.Observable);
Object.freeze(Q.Observable.prototype);

// Deferred

/**
 * a type of Deferred that corresponds to the future state of a
 * value, including both the promise of for that value to be
 * resolved, and a resolver which provides the means to advance the
 * progress of the promise on its way to resolution.
 */

Q.Deferred = function (canceller) {
    var self = Object.create(Q.Deferred.prototype);
    Q.Deferred.constructor.call(self, canceller);
    return Object.freeze(Object.create(self));
};

Q.Deferred.constructor = Object.freeze(function (canceller) {
    var self = this;

    Q.Observable.constructor.call(self);

    var object; // a Promise, either a Reference, Resolution, or Rejection
    var waiting = []; // all pending emissions (emit argument arrays)
    var progress;

    // The Promise for a Deferred must close on the Deferred's
    // internal state.
    /**
     * the promise to be eventually resolved.
     */
    var promise = Object.create(Q.Promise.prototype);

    Q.Promise.constructor.call(promise, canceller);

    /**
     * a Deferred's promise differs from a normal event Emitter
     * because it has two states: "waiting" and "resolved".  When
     * the promise is waiting, all event emissions are queued.  When
     * the promise is either resolved or rejected, all of those
     * events are emitted.  All subsequent emissions are sent
     * immediately.
     */
    promise.setSignal("emit", Object.freeze(function (operator, block /* ...args */) {
        if (waiting)
            waiting.push(Array.prototype.slice.call(arguments));
        else
            object.emit.apply(object, arguments);
    }));

    /**
     * @returns either a promise or the resolved value for the promise.
     */
    promise.setSignal("valueOf", Object.freeze(function () { // ref_send ("near")
        if (waiting)
            return promise;
        if (typeof object === "object" && object !== null)
            return object.valueOf();
        return object;
    }));

    promise.setSignal("progress", Object.freeze(function (_progress) {
        progress = _progress;
    }));

    promise.getProgress = function () {
        return progress;
    };

    self.promise = Object.freeze(Object.create(promise));

    /**
     * resolves the promise or defers it further with a new promise.
     */
    self.emitSuccess = // Node
    self.callback = // Dojo
    self.resolve = Object.freeze(function (resolution) { // ref_send
        if (!waiting)
            return;
        var todo = waiting;
        waiting = undefined;
        object = Q.promise(resolution);
        for (var i = 0, ii = todo.length; i < ii; i++) {
            object.emit.apply(object, todo[i]);
        }
    });

    /**
     * rejects the promise by resolving it with a Rejection with 
     * a given "reason"
     * @param reason {Error}
     */
    self.reject = Object.freeze(function (reason) {
        self.resolve(Q.Rejection(reason));
    });

    /**
     * forwards the "when" message to the contained promise to
     * emulate the promise API.
     */
    self.setSignal("when", function (ok, error, progress) {
        return Q.when(self.promise, ok, error, progress);
    });

    /**
     * a signal that can be called to set the progress state
     * of the deferrence to a number between 0 and 1, or can
     * be observed with the "observe" method.
     * @param progress {Number} between 0 and 1 inclusive.
     */
    self.setSignal("progress", function (_progress) {
        self.promise.progress(_progress);
    });

    /**
     * @returns the progress of the deferred or undefined if that is unknown.
     * User interface widgets should take "undefined" as a queue to display
     * indefinite progress.
     */
    self.getProgress = Object.freeze(function () {
        return progress;
    });

    /** ok
     * a signal that can be observed but not explicitly emitted for when the
     * promise is fully resolved.
     */

    /** error
     * a signal that can be observed but not explicitly emitted for when the
     * promise is rejected.
     */

    // these are special, since they in turn have to call Q.when,
    // which would cause an infinite loop if it were observed while
    // constructing an observer
    self.observe("observe", function (name, observer) {
        if (name == "ok") {
            Q.when(self.promise, observer);
            this.stop();
        } else if (name == "error") {
            Q.when(self.promise, undefined, observer);
            this.stop();
        } else if (name == "progress") {
            Q.when(self.promise, undefined, undefined, observer);
            this.stop();
        }
    });


    /** cancel
     * a signal that rejects the promise and notifies any observers.
     */
    self.setSignal("cancel", function () { // NodeJS
        self.promise.cancel();
    });

});

Object.freeze(Q.Deferred);

/**
 * @param time {Number} in miliseconds, at which point the corresponding
 * promise will be rejected if it has not been resolved.
 */
Q.Deferred.prototype.timeout = Object.freeze(function (time) { // NodeJS
    var self = this;

    if (!Q.setTimeout)
        throw new Error("Timers are not supported by this engine.");

    var timeout = Q.setTimeout(function () {
        self.promise.reject(new Error("timeout"));
    }, time);

    var cancelTimeout = function () {
        Q.clearTimeout(timeout);
    };

    Q.when(self.promise, cancelTimeout, cancelTimeout);

});

// Promise-like Emulation
Q.Deferred.prototype.then = function () {
    var promise = this.promise;
    return promise.then.apply(promise, arguments);
};

// NodeJS
Q.Deferred.prototype.emitError = Object.freeze(function () {
    this.reject.apply(this, arguments);
});

// Dojo
Q.Deferred.prototype.errback = Object.freeze(function () {
    this.reject.apply(this, arguments);
});

// Dojo
Q.Deferred.prototype.addCallback = Object.freeze(function (observer) {
    Q.when(this.promise, observer);
    return this;
});

// Dojo
Q.Deferred.prototype.addErrback = Object.freeze(function (observer) {
    Q.when(this.promise, undefined, observer);
    return this;
});

// Dojo
Q.Deferred.prototype.addBoth = Object.freeze(function (callback, errback) {
    Q.when(this.promise, callback, errback);
    return this;
});

Q.Deferred.prototype.toSource =
Q.Deferred.prototype.toString = Object.freeze(function () {
    return "[object Deferred]";
});

Object.freeze(Q.Deferred.prototype);

/**
 * An object that represents a promise to provide a value eventually.  When
 * this value is provided or fails to be provided can be observed using
 * "Q.when(promise, ok, error, progress)".
 */
// Promise < Observable < Emitter of ok, error, progress but only
// once.
// the canceller is a byproduct of Dojo
Q.Promise = function (canceller) {
    var self = Object.create(Q.Promise.prototype);
    Q.Promise.constructor.call(self);
    return Object.freeze(Object.create(self));
};

Q.Promise.constructor = Object.freeze(function (canceller) {
    var self = this;

    Q.Observable.constructor.call(self); // super-constructor

    // override emit
    self.emit = Object.freeze(function (operator /* ...args */) {
        var method = self[operator] || Object.freeze(function () {
            if (!self.noSuchMethod)
                throw new Error("Promise did not provide requisite noSuchMethod method");
            return self.noSuchMethod.apply(
                self,
                [operator].concat(
                    Array.prototype.slice.call(arguments)
                )
            );
        });
        var args = Array.prototype.slice.call(arguments, 1);
        Q.enqueue(function () {
            method.apply(self, args);
        });
    });

    /**
     * blocks until this promise has been resolved or rejected, if the
     * underlying engine supports blocking promises.
     */
    self.wait = Object.freeze(function () {
        return Q.wait(self);
    });

    self.observe("observe", function (name, observer) {
        if (name === "ok") {
            Q.when(self, observer);
            this.stop();
        } else if (name === "error") {
            Q.when(self, undefined, observer);
            this.stop();
        } else if (name == "progress") {
            Q.when(self, undefined, undefined, observer);
            this.stop();
        }
    });

    /**
     * a signal that rejects this promise with a cancellation error, or the
     * given error and notifies all observers.  Observers are afforded an
     * opportunity to prevent cancellation through their event object.
     */
    // Dojo + NodeJS
    self.setSignal("cancel", function (error) {
        if (canceller) // Dojo
            error = canceller();
        if (!(error instanceof Error))
            error = new Error(error); // TODO CanceledError
        // NodeJS's behavior of depleting the "waiting" queue is
        // implicit to the "ref_send" model of forwarding all
        // emissions to the "Reference" promise.
        self.reject(error);
    });

});

Q.Promise.prototype = Object.create(Q.Emitter.prototype);

Object.freeze(Q.Promise);

// -- kriszyp Kris Zyp
Q.Promise.prototype.then = Object.freeze(function () {
    Q.when.apply(Q, [this].concat(Array.prototype.slice.call(arguments)));
});

/**
 * rejects Promise API calls that are not supported by this type of promise.
 */
Q.Promise.prototype.noSuchMethod = Object.freeze(function () {
    return Q.Rejection("No such method");
});

Q.Promise.prototype.toSource =
Q.Promise.prototype.toString = Object.freeze(function () {
    return "[object Promise]";
});

// NodeJS emitSuccess, emitError, and emitCancel  omitted for
// securability reasons.  Use a Deferred for these.

// NodeJS, Dojo (on a Deferred)
Q.Promise.prototype.addCallback = Object.freeze(function (observer) {
    this.observe("ok", observer);
    return this;
});

// NodeJS, Dojo (on a Deferred)
Q.Promise.prototype.addErrback = Object.freeze(function (observer) {
    this.observe("error", observer);
    return this;
});

// Dojo (on a Deferred)
Q.Promise.prototype.addBoth = Object.freeze(function (callback, errback) {
    this.observe("ok", callback);
    this.observe("error", errback);
    return this;
});

// NodeJS
Q.Promise.prototype.addCancelback = Object.freeze(function (cancelback) {
    this.observe("cancel", cancelback);
    return this;
});

Object.freeze(Q.Promise.prototype);

/**
 * A type of Promise that represents rejection of a promise for some given
 * reason.
 */

Q.Rejection = function (reason) {
    var self = Object.create(Q.Rejection.prototype);
    Q.Rejection.constructor.call(self, reason);
    return Object.create(self);
};

Q.Rejection.constructor = Object.freeze(function (reason) {
    var self = this;
    Q.Promise.constructor.call(self);
    self.setSignal("when", function (ok, error, progress) {
        if (progress)
            Q.enqueue(function () {
                progress(0);
            });
        return error ? error(Q.Rejection(reason)) : Q.Rejection(reason);
    });
});

Q.Rejection.prototype = Object.create(Q.Promise.prototype);

Object.freeze(Q.Rejection);

Q.Rejection.prototype.toSource =
Q.Rejection.prototype.toString = Object.freeze(function () {
    return "[object Rejection]";
});

Object.freeze(Q.Rejection.prototype);

/**
 * A type of Promise that represents a value on its way to resolution.
 */

Q.Reference = function (object) {
    var self = Object.create(Q.Reference.prototype);
    Q.Reference.constructor.call(self, object);
    return Object.freeze(Object.create(self));
};

Q.Reference.constructor = Object.freeze(function (object) {
    var self = this;

    Q.Promise.constructor.call(self);

    if (typeof object === "number" && !isFinite(object))
        return Q.Rejection("NaN");

    self.setSignal("valueOf", function () {
        return object;
    });

    self.setSignal("when", function (ok, error, progress) {
        if (progress)
            Q.enqueue(function () {
                progress(1);
            });
        return ok ? ok(object) : object;
    });

    self.setSignal("get", function (block, name) {
        var result = name === undefined ? object : object[name];
        return block ? block(result) : result;
    });

    self.setSignal("post", function (block, name, args) {
        if (name === undefined)
            return Q.Rejection("A name must be supplied");
        var result = object[name].apply(object, args);
        return block ? block(result) : result;
    });

    self.setSignal("put", function (block, name, value) {
        if (name === undefined)
            return Q.Rejection("A name must be supplied");
        object[name] = value;
        return block ? block(value) : value;
    });

    self.setSignal("del", function (block, name) {
        delete object[name];
        return block ? block(value) : value;
    });

});

Q.Reference.prototype = Object.create(Q.Promise.prototype);

// ref_send alias
Q.Reference.prototype.near = function () {
    return this.valueOf.apply(this, arguments);
};

Object.freeze(Q.Reference);
Object.freeze(Q.Reference.prototype);

/** Q API
 * Promise manager to make it easier to consume and produce
 * promises.
 */

/**
 * returns a Deferred.  A future is an Emitter and contains
 * a promise and its corresponding resolver.
 */
Q.defer = Object.freeze(function () {
    return Q.Deferred();
});

/**
 * given any value, a reference promise, a resolved promise, or a
 * rejected promise, return a promise.  If the given object is not a
 * promise, it will be wrapped as a reference promise.
 */
Q.promise = Object.freeze(function (object) {
    if (Q.isPromise(object)) {
        return object;
    } else {
        return Q.Reference(object);
    }
});

/**
 * returns whether a given object is recognized
 * as a promise.  Presently, this amounts to duck-typing
 * on the presence of a "then" property function, but
 * could conceivably be done by checking whether the object
 * is an instance of Promise.
 *
 * @param object
 * @returns whether the given object is a promise.
 */
Q.isPromise = Object.freeze(function (object) {
    return (object && typeof object.then === "function") ||
        object instanceof Q.Promise // covers Rejections
});

/**
 * returns a Reference.
 * @param value
 */
Q.ref = Object.freeze(function (value) {
    return Q.Reference(value);
});

/**
 * given any value, a reference promise, a resolved promise, or a
 * rejected promise, attempt to return the most resolved form of the
 * value.  If the promise is resolved, this will be a non-promise
 * object.
 */
Q.valueOf = Object.freeze(function (object) {
    if (Q.isPromise(object))
        return object.valueOf();
    return object;
});

/**
 * returns a Rejection
 * @param reason {Error}
 */
Q.reject = Object.freeze(function (reason) {
    return Q.Rejection(reason);
});

/**
 * Registers an observer on a promise.
 * @param value     promise or value to observe
 * @param resolvedCallback function to be called with the resolved value
 * @param rejectCallback  function to be called with the rejection reason
 * @param progressCallback  function to be called when progress is made
 * @return promise for the return value from the invoked callback or the value if it
 * is a non-promise value
 */
Q.when = Object.freeze(function (value, ok, error, progress) {
    if(Q.isPromise(value)){
        return Q.whenPromise(value, ok, error, progress);
    }
    return ok(value);
});

/**
 * Registers an observer on a promise.
 * @param value     promise or value to observe
 * @param resolvedCallback function to be called with the resolved value
 * @param rejectCallback  function to be called with the rejection reason
 * @param progressCallback  function to be called when progress is made
 * @return promise for the return value from the invoked callback
 */
Q.whenPromise = Object.freeze(function (value, ok, error, progress) {
    var deferred = Q.Deferred();
    var done = false; // ensure the untrusted promise
    // makes at most a single call to one of the callbacks

    Q.promise(value).emit("when", function (value) {
        if (done)
            throw new Error("Already observed"); // XXX
        done = true;
        deferred.resolve(Q.Reference(value).when(ok, error, progress));
    }, function (reason) {
        if (done)
            throw new Error("Already observed"); // XXX
        done = true;
        deferred.resolve(Q.Rejection(reason).when(ok, error, progress));
    }, deferred.progress);

    return deferred.promise;
});

/**
 * Gets the value of a property in a future turn.
 * @param target    promise or value for target object
 * @param property      name of property to get
 * @return promise for the property value
 */
Q.get = Object.freeze(function (object, name) {
    var deferred = Q.defer();
    Q.promise(object).get(deferred.resolve, name);
    return deferred.promise;
});

/**
 * Sets the value of a property in a future turn.
 * @param target    promise or value for target object
 * @param property      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.put = Object.freeze(function (object, name, value) {
    Q.promise(object).put(deferred.resolve, name, value);
});

/**
 * Invokes a method in a future turn.
 * @param target    promise or value for target object
 * @param methodName      name of method to invoke
 * @param args      array of invocation arguments
 * @return promise for the return value
 */
Q.post = Object.freeze(function (object, name, args) {
    var deferred = Q.defer();
    Q.promise(object).post(deferred.resolve, name, args);
    return deferred.promise;
});

Q.del = Object.freeze(function (object, name) {
    var deferred = Q.defer();
    Q.promise(object).del(deferred.resolve, name);
});

/**
 * Waits for the given promise to finish, blocking (and executing
 * other events) if necessary to wait for the promise to finish. If
 * target is not a promise it will return the target immediately. If
 * the promise results in an rejection, that rejection will be
 * thrown.
 * @param object promise or value to wait for
 * @return the value of the promise
 */
Q.wait = Object.freeze(function (object) {
    if (!queue)
        throw new Error("Can not wait, the event-queue module is not available");
    if (object && Q.isPromise(object)) {
        var done, error, result;
        Q.when(object, function (value) {
            done = true;
            result = value;
        }, function (reason) {
            done = true;
            error = reason;
        });
        while (!done)
            queue.processNextEvent(true);
        if (error)
            throw error;
        return result;
    } else {
        return object;
    }
});

Object.freeze(exports);

