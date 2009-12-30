
// TODO consolidate API here.
var QE = require("./event-queue");
for (var name in QE) {
    exports[name] = QE[name];
}

exports.setTimeout = function () {
    throw "NYI";
};

exports.setInterval = function () {
    throw "NYI";
};

exports.clearTimeout = function () {
    throw "NYI";
};

exports.clearInterval = function () {
    throw "NYI";
};

