
Function.prototype.bind = function () {
    var args = Array.prototype.slice.call(arguments);
    var self = this;
    var object = args.shift();
    var block = function () {
        return self.apply(
            object,
            Array.prototype
                .slice.call(arguments)
                .concat(args)
        );
    };
    block.name = this.name;
    block.displayName = this.displayName;
    block.length = this.length;
    block.block = this;
    return block;
};

