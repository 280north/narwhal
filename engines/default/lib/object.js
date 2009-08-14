
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

