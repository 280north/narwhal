
var assert = require("assert");
var UTIL = require("util");
var queue = require("event-queue");
var promiseModule = require("promise");

exports["test NodeJS API"] = function () {
    var deferred = new promiseModule.Promise();
    var result;

    deferred.addCallback(function (n) {
        result = n;
    });
    deferred.emitSuccess(10);
    processEvents();
    assert.equal(result, 10);

};

exports["test ref_send API resolve->when"] = function () {

    var deferred = promiseModule.defer();
    var promise = deferred.promise;
    var resolve = deferred.resolve;

    resolve("result");

    var ok, error;
    promiseModule.when(promise, function (value) {
        ok = value;
    }, function (exception) {
        error = exception;
    });
    processEvents();

    assert.ok(ok);
    assert.ok(!error);

};

exports["test reentrant event loop"] = function () {

    queue.enterEventLoop(function () {
        queue.shutdown();
    });

    var ok;
    queue.enqueue(function () {
        ok = true;
    });
    processEvents();

    assert.ok(ok);

};

exports["test ref_send API when->resolve"] = function () {

    var deferred = promiseModule.defer();
    var promise = deferred.promise;
    var resolve = deferred.resolve;

    var ok, error;
    promiseModule.when(promise, function (value) {
        ok = value;
    }, function (exception) {
        error = exception;
    });

    resolve("result");

    processEvents();
    assert.ok(ok);
    assert.ok(!error);

};

exports["test Dojo API"] = function () {

    var d = promiseModule.Deferred();
    queue.enqueue(function () {
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

    queue.enterEventLoop(function () {
        queue.shutdown();
    });

    assert.strictEqual(eventually, true);

};

exports["test reject"] = function () {

    var deferred = promiseModule.defer();
    var promise = deferred.promise;
    var reject = deferred.reject;

    var ok, error;
    promiseModule.when(promise, function (value) {
        ok = value;
    }, function (exception) {
        error = exception;
    });

    reject(new Error("result"));

    processEvents();
    assert.ok(!ok);
    assert.ok(error);

};

exports["test split then"] = function () {

    var p = promiseModule.Promise();
	var p2 = p.then(
	  function () {
	    return '1';
	  })
	 .then(
	  function () {
	    return '2';
	  });
    var ok,ok2;
 
	promiseModule.when(p, function(value) {
		print("p " + value);
	    ok = value;
	  });
	promiseModule.when(p2, function(value) {
	    ok2 = value;
	  });
 
	p.resolve(0);
    processEvents();
    assert.equal(ok, '0');
    assert.equal(ok2, '2');
};

exports["test wait"] = function () {

    var deferred = promiseModule.defer();
    var promise = deferred.promise;
    deferred.resolve(3);
    promiseModule.wait(promise);
};

exports["test all"] = function () {
    var promises = [];
    var deferreds = [];
    for(var i = 0; i<10; i++){
        var deferred = promiseModule.defer();
        deferreds[i] = deferred;
        promises[i] = deferred.promise;
    }
    

    var ok, error;
    assert.ok(!ok);
    promiseModule.when(promiseModule.all(promises), function (value) {
        ok = value;
    }, function (exception) {
        error = exception;
    });
    for(var i = 0; i<10; i++){
        deferreds[i].resolve(i);
    }

    processEvents();
    assert.ok(ok.length == 10);
    assert.ok(ok[3] == 3);
};

exports["test first"] = function () {
    var promises = [];
    var deferreds = [];
    for(var i = 0; i<10; i++){
        var deferred = promiseModule.defer();
        deferreds[i] = deferred;
        promises[i] = deferred.promise;
    }
    

    var ok, error;
    assert.ok(!ok);
    promiseModule.when(promiseModule.first(promises), function (value) {
        ok = value;
    }, function (exception) {
        error = exception;
    });
    for(var i = 0; i<10; i++){
        deferreds[i].resolve(i+1);
    }

    processEvents();
    assert.ok(ok== 1);
};

exports["test seq"] = function () {
    var actions = [];
    var deferreds = [];
    for(var i = 0; i<10; i++){
        actions[i] = function(value){
            var deferred = promiseModule.defer();
            deferred.resolve(value + 1);
            return deferred.promise;
        }
    }
    

    var ok, error;
    assert.ok(!ok);
    promiseModule.when(promiseModule.seq(actions, 0), function (value) {
        ok = value;
    }, function (exception) {
        error = exception;
    });

    processEvents();
    assert.ok(ok== 10);
};


exports["test convertNode"] = function () {
    var callback,passedIn;
    var nodeAsyncFunc = function(a, c){
        passedIn = a;
        callback = c;
    }
    var convertedFunc = promiseModule.convertNodeAsyncFunction(nodeAsyncFunc);
    var promise = convertedFunc(5);
    assert.ok(passedIn, 5);
    var ok, error;
    promiseModule.when(promise, function (value) {
        ok = value;
    }, function (exception) {
        error = exception;
    });
    callback(null,10);
    processEvents();
    assert.ok(ok== 10);
};


function processEvents(){
    queue.enterEventLoop(function () {
        queue.shutdown();
    });
}


if (require.main == module.id)
    require("os").exit(require("test/runner").run(exports));