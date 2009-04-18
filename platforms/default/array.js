// Array additions.

if (typeof Array.prototype.forEach !== "function")
    Array.prototype.forEach =  function(block) { for (var i = 0; i < this.length; i++) block(this[i]); };

Array.isArray = Array.is = function(obj) { return obj && typeof obj === "object" && obj.constructor === Array; }
