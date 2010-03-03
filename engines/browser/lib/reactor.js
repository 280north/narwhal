
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- cadorn Christoph Dorn

var active = false;
var pending = [];
var run = function () {
    var task = pending.shift();
    if (0 === pending.length) {
        active = false;
    } else {
        setTimeout(run, 0);
    }
    task();
};

exports.enqueue = function enqueue(task) {
    pending.push(task);
    if (!active) {
        setTimeout(run, 0);
        active = true;
    }
};

