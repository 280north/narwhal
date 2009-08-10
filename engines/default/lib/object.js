
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

if (!Object.create) {
    Object.create = function (prototype) {
        var Type = function () {};
        Type.prototype = prototype;
        return new Type();
    };
}

if (!Object.freeze) {
    Object.freeze = function (object) {
        return object;
    };
}

if (!Object.defineProperty) {
    // WARNING: does not handle writable, enumerable, configurable
    Object.defineProperty = function(obj, prop, desc) {
        if (undefined != desc.value) obj[prop] = desc.value;
        if ("function" == typeof(desc.get)) obj.__defineGetter__(prop, desc.get);
        if ("function" == typeof(desc.set)) obj.__defineSetter__(prop, desc.set);
    }
}

if (!Object.defineProperties) {
    Object.defineProperties = function(obj, props) {    
        for (var prop in props)
            Object.defineProperty(obj, prop, props[prop]);
    }    
}
