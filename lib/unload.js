
var observers = [];

exports.when = function (observer) {
    observers.unshift(observer);
};

exports.send = function () {
    observers.forEach(function (observer) {
        observer();
    });
};

