
var eventLoop;

/**
 * Configures the system to use a particular event loop
 * implementation.  The event loop must support the event
 * loop API:
 *
 * - setTimeout
 * - clearTimeout
 * - setInterval
 * - clearInterval
 * - enqueue is optional; if it is not provided, the
 *   event-loop module will provide one in terms of
 *   setTimeout(task, 0).
 *
 * @throws Error if an event loop has already been
 * configured.
 *
 */
exports.setEventLoop = function (_eventLoop) {
    if (eventLoop)
        throw new Error("An event loop has already been loaded.");
    eventLoop = _eventLoop;
};

/**
 * Returns an event loop implementation.  If no event loop
 * has been configured, configures the "event-loop-engine"
 * module as the default implementation.  After this method
 * has been called, the event loop cannot be changed.
 * The "event-loop" module itself uses this method the first
 * time it is required.
 */
exports.getEventLoop = function () {
    if (!eventLoop)
        eventLoop = require("event-loop-engine");
    return eventLoop;
};

