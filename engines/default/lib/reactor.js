
// -- kriskowal Kris Kowal Copyright 2009-2010 MIT License

var tasks = [];

require('unload').when(function () {
    while (tasks.length)
        tasks.shift()();
});

exports.enqueue = function (task) {
    tasks.push(task);
};

