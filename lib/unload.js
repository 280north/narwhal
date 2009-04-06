
var observers = [];

exports.observe = function (observer) {
    observers.push(observer);
};

exports.send = function () {
    observers.forEach(function (observer) {
        observer();
    });
};

