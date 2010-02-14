
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var tasks = [];

require('unload').when(function () {
    while (tasks.length)
        tasks.shift()();
});

exports.enqueue = function (task) {
    tasks.push(task);
};

