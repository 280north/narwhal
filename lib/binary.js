var Binary = exports.Binary = require("./{platform}/binary").Binary;


Binary.prototype.forEach = function(block) {
    block(this);
}

Binary.prototype.toBinary = function() {
    return this;
}