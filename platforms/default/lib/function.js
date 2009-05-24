
Function.prototype.bind = function () {
    var args = Array.prototype.slice.call(arguments);
    var self = this;
    if (self.bind)
        return self;
    var block = function () {
        return self.call.apply(self, args);
    };
    block.name = this.name;
    block.displayName = this.displayName;
    block.length = this.length;
    block.bind = self;
    return block;
};

