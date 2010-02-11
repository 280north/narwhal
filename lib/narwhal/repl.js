
// Tom Robinson
// Kris Zyp

var system = require("system"),
    util = require('util'),
    replEval = eval;

// fix quit(), I have no idea why the Rhino shell provided quit doesn't work, but it doesn't
quit = function(code){
    java.lang.System.exit(code || 0);
};

try {    
    var SharedWorker = require("worker").SharedWorker,
        queue = require("event-queue");
    
    exports.repl = function(dontEnterEventLoop) {
        var replWorker = new SharedWorker("narwhal/repl-worker", "repl-worker");
        // the worker receives the input from the users and posts the inputs back to us
        replWorker.port.onmessage = function(message){
            // got a command from the console
            evaluateAndPrint(message.data);
            replWorker.port.postMessage(""); // just signal we are done displaying the result
        };
        if(!dontEnterEventLoop){
            // now enter the event loop
            queue.enterEventLoop(); 
        }
    };
}
catch(e) {
    // workers are not available
    exports.repl = require("narwhal/repl-worker").startRepl(evaluateAndPrint);
}

function evaluateAndPrint(text) {
    try {
        var result = replEval(text);
        var repr = util.repr(result);
        if (repr.length > 76 || /\n/.test(repr))
            repr = String(result);
        if (!util.no(result)) {
            system.stdout.write(repr + '\n');
            system.stdout.flush();
            global._ = result;
        }

    } catch (e) {
        system.stdout.write("    exception from uncaught JavaScript throw: " + e + "\n");
        system.stdout.flush();
    }
    
}

if (module.id == require.main)
    exports.repl();

