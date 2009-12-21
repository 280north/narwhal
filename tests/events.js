
var assert = require("assert");
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
    d.addCallback = function (value) {
        eventually = value;
    };

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


if (module == require.main) {
    require("os").exit(require("test").run(exports));
}

