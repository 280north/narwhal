
// -- kriskowal Kris Kowal Copyright 2009-2010 MIT License

var observers = [];

exports.when = function (observer) {
    observers.unshift(observer);
};

exports.send = function () {
    observers.forEach(function (observer) {
        observer();
    });
};

