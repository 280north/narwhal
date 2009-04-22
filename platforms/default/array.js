// Array additions.

if (typeof Array.prototype.forEach !== "function")
    Array.prototype.forEach =  function(block) { for (var i = 0; i < this.length; i++) block(this[i]); };

Array.isArray = function(obj) { return obj && typeof obj === "object" && obj.constructor === Array; }

// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function(fun /*, thisp*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function")
          throw new TypeError();

        var res = new Array(len);
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this)
                res[i] = fun.call(thisp, this[i], i, this);
        }

        return res;
    }
}
