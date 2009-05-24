
Function.prototype.bind = function () {
    var args = Array.prototype.slice.call(arguments);
    var self = this;
    var block = function () {
        return self.call.apply(self, args);
    };
    block.name = this.name;
    block.displayName = this.displayName;
    block.length = this.length;
    block.block = this;
    return block;
};

