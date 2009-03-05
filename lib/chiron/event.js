/*file chiron src/event.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

/*status works, tested in Safari and Firefox, requires text on the documentation outline */
/**
    a system for observing signals that send events.

    Usage::

        var signal = event.Signal();
        var observer = function (arguments, ...) {
            var event = this;
            event.stop();
            event.preventDefault();
            event.stopPropagation();    
        };
        signal.observe(observer);
        signal(arguments, ...);

        observable = event.Observable();
        observable.setSignal('bam');
        observable.observe('bam', function (arguments, ...) { });
        var bammed = observable.observe('bam', function (arguments, ...) { });
        bammed.observeBefore(function (arguments, ...) { });
        bammed.observeAfter(function (arguments, ...) { });
        observable.bam(arguments, ...);

        event.observe(window);
        window.setSignal('load');
        window.setSignal('error');
        window.observe('error', function (message, url, line) { });

        var a = event.Observable();
        a.setSignal('ready');
        var b = event.Observable();
        b.setSignal('ready');
        var c = event.Observable();
        c.setSignal('ready');

        event.depend([a.ready, b.ready], function () {
            c.value = a.value + b.value;
            c.ready();
        });


    ----

*/

var base = require('./base');

/*** Event
*/
exports.Event = base.type(function (self, supr) {
    var propagation = true;
    var defaulting = true;

    /**** stop
    */
    self.stop = function () {
        self.stopPropagation();
        self.cancelDefault();
    };

    /**** stopPropgation
    */
    self.stopPropagation = function () {
        propagation = false;
    };

    /**** cancelDefault
    */
    self.cancelDefault = function () {
        defaulting = false;
    };

    /**** getPropagation
    */
    self.getPropagation = function () {
        return propagation;
    };

    /**** getDefaulting
    */
    self.getDefaulting = function () {
        return defaulting;
    };

});

/*** Signal
    accepts an ``Event`` type and 
*/
exports.Signal = base.type(function (self, supr) {
    var Event;
    var action;

    var before = base.List();
    var after = base.List();

    self.init = function (EventValue, actionValue) {
        Event = EventValue;
        action = actionValue;
        if (base.no(Event)) {
            Event = exports.Event;
        }
    };

    /**** observeBefore
    */
    self.observeBefore = function (observer) {
        var signal = exports.Signal(exports.Event, observer);
        before.unshift(signal);
        return signal;
    };
    
    /**** observe
    */
    self.observe = function (observer) {
        var signal = exports.Signal(exports.Event, observer);
        before.push(signal);
        return signal;
    };

    /**** observeAfter
    */
    self.observeAfter = function (observer) {
        var signal = exports.Signal(exports.Event, observer);
        after.push(signal);
        return signal;
    };

    /**** observer
    */
    self.observer = function (observer) {
        var context = this;
        return function () {
            var args = arguments;
            self.observe(function () {
                observer.apply(context, args);
            });
        };
    };

    /**** dismiss
    */
    self.dismiss = function (observer) {
        before.discard(observer);
        after.discard(observer);
    };

    /**** setAction
    */
    self.setAction = function (actionValue) {
        action = actionValue;
    };

    /**** getAction
    */
    self.getAction = function () {
        return action;
    };

    /**** send
    */
    self.send = function (event, args) {

        if (base.no(event)) {
            event = Event();
        }

        if (base.no(args)) {
            args = [];
        } else {
            args = base.array(args);
        }

        /* before */
        before.forEach(function (observer) {
            if (!event.getPropagation()) {
                throw base.stopIteration;
            }
            observer.send(event, args);
        });

        /* during */
        if (action && event.getDefaulting()) {
            try {
                action.apply(event, args);
            } catch (exception) {
                environment.print(exception, 'error');
                throw exception;
            }
        }

        /* and after */
        after.forEach(function (observer) {
            if (!event.getPropagation()) {
                throw base.stopIteration;
            }
            observer.send(event, args);
        });

    };

    /**** invoke
    */
    self.invoke = function () {
        self.send(Event(), arguments);
    };

});

/*** Signaler
*/
exports.Signaler = base.type(function (self, supr) {
    var signals = base.Dict();

    /**** observeBefore
    */
    self.observeBefore = function (name, observer) {
        return signals.get(name).observeBefore(observer);
    };

    /**** observe
    */
    self.observe = function (name, observer) {
        return signals.get(name).observe(observer);
    };

    /**** observeAfter
    */
    self.observeAfter = function (name, observer) {
        return signals.get(name).observeAfter(observer);
    };

    /**** dismiss
    */
    self.dismiss = function (name, observer) {
        signals.get(name).dismiss(observer);
    };

    /**** signal
    */
    self.signal = function (name, event, args) {
        signals.get(name).send(event, args);
    };

    /**** observer
    */
    self.observer = function (name, observer, context) {
        return signals.get(name).observer(observer, context);
    };

    /**** setSignal
    */
    self.setSignal = function (name, signal) {
        if (base.no(signal)) { signal = Signal() }
        signals.set(name, signal);
    };

    /**** getSignal
    */
    self.getSignal = function (name, signal) {
        return signals.get(name, signal);
    };
    
    /**** hasSignal
    */
    self.hasSignal = function (name) {
        return signals.hasKey(name);
    };

    /**** delSignal
    */
    self.delSignal = function (name) {
        return signals.del(name);
    };

});

/*** Observable
*/
exports.Observable = base.type([exports.Signaler], function (self, supr) {

    /**** setSignal
    */
    self.setSignal = function (name, signal) {
        var original = self[name];
        if (base.no(signal)) {
            signal = exports.Signal(exports.Event, (function (original, context) {
                return function () {
                    if (original) {
                        original.apply(context, arguments);
                    }
                };
            })(original, self));
        }
        supr.setSignal(name, signal);
        self[name] = signal;
    };

    /**** observeBefore
    */
    self.observeBefore = function (name, observer) {
        if (!self[name]) {
            throw new Error(
                "No signal for " + base.enquote(name) + " events " +
                "on " + base.enquote(base.getTypeFullName(self)) + ' objects.'
            );
        }
        if (!base.isInstance(self[name], exports.Signal)) {
            self.setSignal(name);
        }
        return self[name].observeBefore(observer);
    };

    /**** observe
    */
    self.observe = function (name, observer) {
        if (!self[name]) {
            throw new Error(
                "No signal for " + base.enquote(name) + " events " +
                "on " + base.enquote(base.getTypeName(self)) + ' objects.'
            );
        }
        if (!base.isInstance(self[name], exports.Signal)) {
            self.setSignal(name);
        }
        return self[name].observe(observer);
    };

    /**** observeAfter
    */
    self.observeAfter = function (name, observer) {
        if (!self[name]) {
            throw new Error(
                "No signal for " + base.enquote(name) + " events " +
                "on " + base.enquote(base.getTypeName(self)) + ' objects.'
            );
        }
        if (!base.isInstance(self[name], exports.Signal)) {
            self.setSignal(name);
        }
        return that[name].observeAfter(observer);
    };

});

/*** State
    a special kind of ``Signal`` that only signals once.  From
    that point on, anyone who observes the signal will be immediately
    invoked with the original event and arguments.
*/
exports.State = base.type([exports.Signal], function (self, supr) {
    var args;
    var event;

    self.init = function () {
        supr.observeBefore(function () {
            args = arguments;
            event = this;
        });
        supr.init.apply(self, arguments);
    };

    /**** observe
    */
    self.observe = function (observer) {
        if (event) {
            if (event.getPropagation()) {
                observer.apply(event, args);
            }
        } else {
            return supr.observe(observer);
        }
    };

    /**** reset
        remands an affirmative state so that the
        state can signal its observers again.

        does not remove any previously added observers.
    */
    self.reset = function () {
        event = undefined;
    };

    /**** bool
        whether the state is affirmative.
    */
    self.bool = function () {
        return event;
    };

    /**** send
        sets the state and signals all observers that
        the state is now affirmative.  Thereafter, all
        attached observers will be signaled immediately.
    */
    self.send = function (eventValue, args) {
        if (exports.no(event)) {
            if (eventValue)
                event = eventValue;
            else
                event = exports.Event();
            supr.send(event, args);
        }
    };

});

/*** observe
*/
exports.observe = function (object, name, observer) {
    if (object.observe)
        return object.observe(name, observer);
    if (object[name] && object[name].observe)
        return object[name].observe(observer);
};

/*** observeBefore
*/
exports.observeBefore = function (object, name, observer) {
    if (object.observeBefore)
        return object.observeBefore(name, observer);
    if (object[name] && object[name].observeBefore)
        return object[name].observeBefore(observer);
};

/*** observeAfter
*/
exports.observeAfter = function (object, name, observer) {
    if (object.observeAfter)
        return object.observeAfter(name, observer);
    if (object[name] && object[name].observeAfter)
        return object[name].observeAfter(observer);
};


/*license

    Legal
    =======
    
    Chiron is a component of the Tale web-game project.
    
    See <credit.txt> for a complete list of
    contributions and their licenses.  All contributions are provided
    under permissive, non-viral licenses including MIT, BSD, Creative Commons
    Attribution 2.5, Public Domain, or Unrestricted.
    
    
    License
    =======
    
    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    
    MIT License
    -----------
    
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.

*/

