
if (!Object.keys) {
    Object.keys = function (object) {
        var keys = [];
        for (var name in object) {
            if (Object.prototype.hasOwnProperty.call(object, name)) {
                keys.push(name);
            }
        }
        return keys;
    };
}

if (!Object.defineProperty)
    Object.defineProperty = function(object, prop, descriptor) {
        var has = Object.prototype.hasOwnProperty;
        if (typeof descriptor == "object") {
            if (has.call(descriptor, "value")) {
                if (!object.__lookupGetter__(prop) && !object.__lookupSetter__(prop))
                    // data property defined and no pre-existing accessors
                    object[prop] = descriptor.value;
                if((has.call(descriptor, "get") || has.call(descriptor, "set")))
                    // descriptor has a value prop but accessor already exists
                    throw new TypeError("Object doesn't support this action");
            }
            if ( // can't implement these features allow false but not true
                !(has.call(descriptor, "writable") ? descriptor.writable : true) ||
                !(has.call(descriptor, "enumerable") ? descriptor.enumerable : true) ||
                !(has.call(descriptor, "configurable") ? descriptor.configurable : true)
            ) throw new RangeError("This implementation of Object.defineProperty does not support configurable, enumerable, or writable.");
            else if (typeof descriptor.get == "function")
                object.__defineGetter__(prop, descriptor.get);
            if (typeof descriptor.set == "function")
                object.__defineSetter__(prop, descriptor.set);
        }
        return object;
    };

if (!Object.defineProperties)
    Object.defineProperties = function(object, props) {
        for (var prop in props)
            Object.defineProperty(object, prop, props[prop]);
        return object;
    };

if (!Object.create)
    Object.create = function(proto, props) {
        function Type() {};
        Type.prototype = proto;
        var object = new Type();
        if ( typeof props !== "undefined" )
            Object.defineProperties(object, props);
        return object;
    };

if (!Object.freeze) {
    Object.freeze = function (object) {
        return object;
    };
}

