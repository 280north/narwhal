
var UTIL = require("narwhal/util");
var ASSERT = require("assert");
var TERM = require("narwhal/term"),
    colors = TERM.colors,
    print = TERM.stream.print;
var INDENT = "",
    timeHash = {},
    countHash = {};
var join = Array.prototype.join,
    slice = Array.prototype.slice;

function dump(type, color) {
    var suffix = "";
    var prefix = type ? type.toUpperCase() + ": " : "";
    if (color in colors) {
        prefix = "\0"+ color + "(" + prefix;
        suffix = "\0)";
    }
    return function () {
        print(INDENT + prefix + join.call(arguments, " ") + suffix);
        return exports;
    }
}

var timeDump = dump("time", "purple"),
    dumpGroup = dump("group"),
    countDump = dump("count", "orange"),
    dumpDir = dump();

exports.log = dump("log");
exports.debug = dump("debug", "cyan");
exports.info = dump("info", "blue");
exports.warn = dump("warn", "yellow");
exports.error = dump("error", "red");
exports.assert = function assert(expression) {
    var message = slice.call(arguments, 1).join(" ");
    if (expression)
        print(message);
    else
        ASSERT.fail(message);
    return exports;
};

exports.dir = exports.dirxml = function dir(thing) {
    dumpDir(represent(thing));
    return exports;
}

exports.group = function group() {
    dumpGroup.apply(null, arguments)
    INDENT += "    ";
    return exports;
}
exports.groupEnd = function groupEnd() {
    INDENT = INDENT.substr(0, Math.max(INDENT.length - 1, 0));
}

exports.time = function time(name) {
    timeHash[name] = (new Date()).getTime();
    return exports;
}
exports.timeEnd = function time(name) {
    timeDump(name || "", (new Date()).getTime() - timeHash[name]);
    return exports;
}
exports.count = function count(title) {
    countDump(title || "", countHash[title] = ((countHash[title] || 0) + 1));
}
exports.profile = exports.profileEnd = function () {
    print("NYI")
};

// TODO consolidate this into UTIL.repr, perhaps UTIL.represent,
// maybe borrow Node's inspect
function represent(thing) {
    var result;
    switch (typeof thing) {
        case "string":
            result = '"' + thing + '"';
            break;
        case "number":
            result = thing;
            break;
        case "object":
            if (UTIL.isArrayLike(thing) === true)
                return "[" + thing.join(",") + "]";
            var names = [];
            result = "{";
            for (var name in thing) names.push(name);
            if (names.length > 0) {
                result += names.slice(0, 7).map(function (name) {
                    var result = "\n    ";
                    try {
                        var get, set;
                        if (undefined !== thing.__lookupGetter__ && undefined !== (get = thing.__lookupGetter__(name))) {
                            result += "get " + name + "() {...}";
                        }
                        if (undefined !== thing.__lookupSetter__ && undefined !== (set = thing.__lookupSetter__(name))) {
                            result += (get ? ", " : "") + "set " + name + "() {...}";
                        }
                        if (undefined === get && undefined === set) {
                            var property = thing[name];
                            result += name + ": " + (typeof property == "object" ? "{...}" : represent(property));
                        }
                    } catch(e) {
                        result += "[Exception!]";
                    }
                    return result;
                }).join(", ");
                if (names.length > 7) result += ", ...";
                result += "\n}";
            }
            break;
        case "function":
            result = thing.toString().replace(/^\s*|{[\s\S]*/g,"") + "{...}";
            break;
        default:
            result = thing;
    }
    return result;
};

