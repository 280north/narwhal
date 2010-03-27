
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

/**
 *  This module, likely to change, is exclusively for the
 *  purpose of arranging for an "event-loop-engine" to begin
 *  dispatching events when the initial thread of execution
 *  runs to its completion.
 *
 *  narwhal/narwhal.js checks whether this module has been
 *  loaded after the main module returns and calls the
 *  "emit" method.  No module is intended to call "emit"
 *  manually.
*/

var observers = [];

/**
 * Arrange for an observer function to be called after the
 * "main" module returns.
 *
 * @param observer {Function}
 * @returns undefined
 */
exports.when = function (observer) {
    observers.unshift(observer);
};

/**
 * This method, called by the engine after the "main" module
 * returns, invokes all of the observers (intended to be a
 * single event loop runner registered by an
 * "event-loop-engine") in the order they were requested.
 */
exports.emit = function () {
    observers.forEach(function (observer) {
        observer();
    });
};

exports.send = function () {
    require("narwhal/deprecated").deprecated("unload.send is deprecated; use " + 
        "unload.emit or avoid calling this routine manually");
    exports.emit();
};

