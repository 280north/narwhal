
var Binary = exports.Binary = require("binary-platform").Binary;

Binary.prototype.forEach = function(block) {
    block(this);
}

Binary.prototype.toBinary = function() {
    return this;
}

