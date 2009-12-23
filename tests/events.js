
var assert = require("assert");
var UTIL = require("util");
var Q = require("events");

exports["test NodeJS API"] = function () {
    var deferred = new Q.Deferred();
    var result;

    deferred.addCallback(function (n) {
        result = n;
    });
    /* or
    deferred.observe('ok', function (n) {
        result = n;
    });
    */

    deferred.emitSuccess(10);

    Q.enterEventLoop(function () {
        Q.shutdown();
    });

    assert.equal(result, 10);

};

exports["test ref_send API resolve->when"] = function () {

    var deferred = Q.defer();
    var promise = deferred.promise;
    var resolve = deferred.resolve;

    resolve("result");

    var ok, error;
    Q.when(promise, function (value) {
        ok = value;
    }, function (exception) {
        error = exception;
    });

    Q.enterEventLoop(function () {
        Q.shutdown();
    });

    assert.ok(ok);
    assert.ok(!error);

};

exports["test reentrant event loop"] = function () {

    Q.enterEventLoop(function () {
        Q.shutdown();
    });

    var ok;
    Q.enqueue(function () {
        ok = true;
    });

    Q.enterEventLoop(function () {
        Q.shutdown();
    });

    assert.ok(ok);

};

exports["test ref_send API when->resolve"] = function () {

    var deferred = Q.defer();
    var promise = deferred.promise;
    var resolve = deferred.resolve;

    var ok, error;
    Q.when(promise, function (value) {
        ok = value;
    }, function (exception) {
        error = exception;
    });

    resolve("result");

    Q.enterEventLoop(function () {
        Q.shutdown();
    });
    assert.ok(ok);
    assert.ok(!error);

};

exports["test Dojo API"] = function () {

    var d = Q.Deferred();
    Q.enqueue(function () {
        try {
            d.callback(true);
        } catch (e) {
            d.errback(new Error());
        }
    });

    var eventually;
    d.addCallback(function (value) {
        eventually = value;
    });

    Q.enterEventLoop(function () {
        Q.shutdown();
    });

    assert.strictEqual(eventually, true);

};

exports.testObservable = function () {

    var chronicle = [];

    var X = function () {
        Q.Observable.constructor.call(this);
        this.setSignal("foo", function () {
            chronicle.push("foo called");
        });
    };
    X.prototype = Object.create(Q.Observable.prototype);

    var x = new X();
    x.observe("foo", function () {
        chronicle.push("foo anticipated");
    });
    x.foo();

    assert.deepEqual(chronicle, [
        "foo anticipated",
        "foo called"
    ]);
};

exports["test who observes the observer"] = function (assert) {

    var observeObserved;
    var bar;
    var barObserved;

    var foo = Q.Observable();

    foo.setSignal("bar", function () {
        bar = true;
    });

    foo.observe("observe", function (name, observer) {
        observeObserved = name;
    });
    foo.observe("bar", function (value) {
        barObserved = value;
    });
    foo.bar(10);

    assert.equal(barObserved, 10, "bar observed");
    assert.equal(observeObserved, "bar", "observe observed");

};

exports["test DOM-like event propagation"] = function () {
    var chronicle = [];
    var signal = Q.Signal(function () {
        chronicle.push('default action');
    });
    signal.observe(function (n) {
        chronicle.push('x' + n);
    });
    signal.observe(function (n) {
        chronicle.push('y' + n);
        this.stopPropagation();
    });
    signal.observe(function (n) {
        chronicle.push('z' + n);
    });
    signal.emit(1);
    assert.deepEqual(chronicle, ['x1', 'y1', 'default action']);
};

exports["test DOM-like default action cancellation"] = function () {
    var chronicle = [];
    var signal = Q.Signal(function (n) {
        chronicle.push('default action');
    });
    signal.observe(function (n) {
        this.cancelDefault();
    });
    signal.emit(1);
    assert.deepEqual(chronicle, []);
};

exports["test chained deferrence"] = function () {

    var async = function (n) {
        var defer = Q.defer();
        Q.enqueue(function () {
            defer.resolve(n);
        });
        return defer.promise;
    };

    var x = Q.when(async(1), function (a) {
        return Q.when(async(2), function (b) {
            return a + b;
        });
    });

    var y;
    Q.when(x, function (x) {
        y = x;
    });

    Q.enterEventLoop(function () {
        Q.shutdown();
    });

    assert.equal(y, 3);
};

var permute = function (setup, teardown, order, resolution) {
    return function () {

        var chronicle = [];
        var print = function (message) {
            chronicle.push(message);
        };

        var deferred = Q.defer();

        setup = ({

            "PromiseWhen": function () {

                Q.when(deferred.promise, function () {
                    print('ok');
                }, function () {
                    print('error');
                }, function (n) {
                    print('progress ' + (n * 100).toFixed() + "%");
                });

            },

            "DeferredWhen": function () {

                Q.when(deferred, function () {
                    print('ok');
                }, function () {
                    print('error');
                }, function (n) {
                    print('progress ' + (n * 100).toFixed() + "%");
                });

            },

            "PromiseObservers": function () {

                deferred.promise.observe('ok', function () {
                    print('ok');
                });
                deferred.promise.observe('error', function () {
                    print('error');
                });
                deferred.promise.observe('progress', function (n) {
                    print('progress ' + (n * 100).toFixed() + '%');
                });

            },

            "DeferredObservers": function () {

                deferred.observe('ok', function () {
                    print('ok');
                });
                deferred.observe('error', function () {
                    print('error');
                });
                deferred.observe('progress', function (n) {
                    print('progress ' + (n * 100).toFixed() + '%');
                });

            },

            "PromiseThen": function () {

                deferred.promise.then(function () {
                    print('ok');
                }, function () {
                    print('error');
                }, function (n) {
                    print('progress ' + (n * 100).toFixed() + "%");
                });

            },

            "DeferredThen": function () {

                deferred.then(function () {
                    print('ok');
                }, function () {
                    print('error');
                }, function (n) {
                    print('progress ' + (n * 100).toFixed() + "%");
                });

            },

            "Callback/Errback": function () {

                deferred.addCallback(function (value) {
                    print('ok');
                }).addErrback(function (value) {
                    print('error');
                });

                // no analog, use observer
                deferred.observe("progress", function (n) {
                    print('progress ' + (n * 100).toFixed() + "%");
                });

            },

            "Both": function () {

                deferred.addBoth(function (value) {
                    print('ok');
                }, function (value) {
                    print('error');
                });

                // no analog, use observer
                deferred.observe("progress", function (n) {
                    print('progress ' + (n * 100).toFixed() + "%");
                });

            },

        })[setup];

        teardown = ({
            "Resolve/Reject": function () {
                if (resolution == "ok") {
                    deferred.resolve();
                } else {
                    deferred.reject();
                }
            },
            "Callback/Errback": function () {
                if (resolution == "ok") {
                    deferred.callback();
                } else {
                    deferred.errback();
                }
            }
        })[teardown];

        order = ({
            "Observe->Resolve": function () {
                setup();
                teardown();
            },
            "Resolve->Observe": function () {
                teardown();
                setup();
            }
        })[order];

        order();

        Q.enterEventLoop(function () {
            Q.shutdown();
        });

        if (resolution == "ok") {
            assert.deepEqual(chronicle, [
                'ok',
                'progress 100%'
            ]);
        } else {
            assert.deepEqual(chronicle, [
                'error',
                'progress 0%'
            ]);
        }

    };
};

var permutations = exports['test API permutations'] = {};

UTIL.forEach([
    "Observe->Resolve",
    "Resolve->Observe",
], function (order) {
    var orderPermutations = permutations['test ' + order] = {};
    UTIL.forEach([
        "DeferredObservers",
        "PromiseObservers",
        "DeferredThen",
        "PromiseThen",
        "DeferredWhen",
        "PromiseWhen",
        "Callback/Errback",
        "Both"
    ], function (setup) {
        var setupPermutations = orderPermutations['test ' + setup] = {};
        UTIL.forEach(["Resolve/Reject", "Callback/Errback"], function (teardown) {
            var teardownPermutations = setupPermutations['test ' + teardown] = {};
            UTIL.forEach(["ok", "error"], function (result) {
                teardownPermutations['test ' + result] =
                    permute(setup, teardown, order, result);
            });
        });
    });
});

if (module == require.main) {
    require("os").exit(require("test").run(exports));
}

