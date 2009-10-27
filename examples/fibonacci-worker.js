// Adapted from https://developer.mozilla.org/En/Using_web_workers

var Worker = require("worker").Worker;

var results = [];

function resultReceiver(event) {
    results.push(parseInt(event.data));
    if (results.length == 2) {
        postMessage(results[0] + results[1]);
    }
}

function errorReceiver(event) {
    throw event.data;
}

onmessage = function(event) {
    var n = parseInt(event.data);

    if (n == 0 || n == 1) {
        postMessage(n);
        return;
    }

    for (var i = 1; i <= 2; i++) {
        var worker = new Worker(module.path);
        worker.onmessage = resultReceiver;
        worker.onerror = errorReceiver;
        worker.postMessage(n - i);
    }
};

if (module.id == require.main)
    print("Run fibonacci.js instead of fibonacci-worker.js");
