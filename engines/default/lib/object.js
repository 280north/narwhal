
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
    Object.defineProperty = function(object, property, descriptor) {
        var has = Object.prototype.hasOwnProperty;
        if (typeof descriptor == "object") {
            if (has.call(descriptor, "value")) {
                if (!object.__lookupGetter__(property) && !object.__lookupSetter__(property))
                    // data property defined and no pre-existing accessors
                    object[property] = descriptor.value;
                if ((has.call(descriptor, "get") || has.call(descriptor, "set")))
                    // descriptor has a value property but accessor already exists
                    throw new TypeError("Object doesn't support this action");
            }
            if ( // can't implement these features; allow false but not true
                !(has.call(descriptor, "writable") ? descriptor.writable : true) ||
                !(has.call(descriptor, "enumerable") ? descriptor.enumerable : true) ||
                !(has.call(descriptor, "configurable") ? descriptor.configurable : true)
            )
                throw new RangeError(
                    "This implementation of Object.defineProperty does not " +
                    "support configurable, enumerable, or writable."
                );
            else if (typeof descriptor.get == "function")
                object.__defineGetter__(property, descriptor.get);
            if (typeof descriptor.set == "function")
                object.__defineSetter__(property, descriptor.set);
        }
        return object;
    };

if (!Object.defineProperties) {
    Object.defineProperties = function(object, properties) {
        for (var property in properties) {
            if (Object.prototype.hasOwnProperty.call(properties, property))
                Object.defineProperty(object, property, properties[property]);
        }
        return object;
    };
}

if (!Object.create) {
    Object.create = function(prototype, properties) {
        function Type() {};
        Type.prototype = prototype;
        var object = new Type();
        if (typeof properties !== "undefined")
            Object.defineProperties(object, properties);
        return object;
    };
}

if (!Object.freeze) {
    Object.freeze = function (object) {
        return object;
    };
}

