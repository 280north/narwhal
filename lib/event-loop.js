
var eventLoop = require("event-loop-setup").getEventLoop();

exports.enqueue = eventLoop.enqueue || function (task) {
    setTimeout(function () {
        // uses a closure to ensure that any additional
        // parameters are laundered
        task();
    }, 0);
};

exports.setTimeout = eventLoop.setTimeout;
exports.clearTimeout = eventLoop.clearTimeout;
exports.setInterval = eventLoop.setInterval;
exports.clearInterval = eventLoop.clearInterval;

