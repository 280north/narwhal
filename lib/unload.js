
var observers = [];

exports.when = function (observer) {
    observers.push(observer);
};

exports.send = function () {
    observers.forEach(function (observer) {
        observer();
    });
};

