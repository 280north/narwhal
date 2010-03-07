
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var tusk = require("../../tusk");
var util = require("util");
var http = require("http-client");
var packages = require("packages");
var stream = require("term").stream;

var Parser = exports.Parser = function () {
};

Parser.prototype.act = function (args, options) {
    this._action(args, options);
};

Parser.prototype._action = function (args, options) {
    var command = args.shift();
    var packages = tusk.readCatalog().packages;
    index(packages);
    var predicate = Or(args);
    var results = util.values(packages).map(function (info) {
        return [predicate(info), info];
    }).filter(function (pair) {
        return pair[0] != 0;
    });
    util.sort(results);
    util.forEachApply(results, function (score, info) {
        stream.print(
            "\0green(" + info.name + "\0)" +
            (info.description ? ": " + info.description : "")
        );
    });
    options.acted = true;
};

var index = function (packages) {
    util.forEachApply(packages, function (name, info) {
        if (!info.name) {
            info.name = name;
        }
        if (!info.fullText) {
            info.fullText = [
                info.name
            ].concat(info.keywords).concat([
                info.description
            ]).join(" ");
        }
    });
    return packages;
}

var Text = function (args) {
    args = args.map(function (arg) {
        return new RegExp(
            "\\b" + RegExp.escape(arg) + "\\b",
            "i"
        );
    });
    return function (info) {
        var accumulator = undefined;
        return Math.min.apply(this, args.map(function (arg) {
            return info.fullText.search(arg) + 1;
        }));
    }
};

var Terms = function (args) {
    for (var length = 0; length < args.length; length++)
        if (args[length] == "--")
            break;
    if (length) {
        if (/^--/.test(args[0])) {
            var pattern = args.shift().match(/^--([^=]+)(?:=(.*))?/).slice(1);
            var key = pattern[0];
            var value = pattern[1];
            if (!!value) {
                args.unshift(value);
            }
            var parts = key.split(".");
            return function (info) {
                parts.forEach(function (part) {
                    if (Array.isArray(info)) {
                        info = info.map(function (node) {
                            if (node)
                                return node[part];
                        });
                    } else if (info) {
                        info = info[part];
                    }
                });
                var value = args[0];
                if (Array.isArray(info)) {
                    return util.has(info, value);
                } else {
                    return info == value;
                }
            }
        } else if (/^-/.test(args[0])) {
            throw new Error("Option " + args[0] + " not recognized.");
        } else {
            return Text(args);
        }
    } else {
        return Text(args);
    }
};

// - recursive descent scanner
// - divide and conquor

var BinaryOperator = function (Low, High, _, __) {
    return function Self(args) {
        var length = args.length;
        for (var i = 0; i < length; i++)
            if (args[i] == "--")
                break;
        while (i >= 0) {
            i--;
            var arg = args[i];
            if (arg == _ || arg == __) {
                var left = Self(args.slice(0, i));
                var right = High(args.slice(i + 1));
                return function () {
                    return Low(
                        left.apply(this, arguments),
                        right.apply(this, arguments)
                    );
                }
            }
        }
        return High(args);
    }
}

var And = BinaryOperator(function (lhs, rhs) {
    return lhs * rhs;
}, Terms, '-a', '--and');

var Or = BinaryOperator(function (lhs, rhs) {
    return lhs || rhs ? lhs + rhs : 0;
}, And, '-o', '--or');

Parser.prototype._help = "{keyword}, --and, --or, --{key} {value}";

exports.parser = new Parser();

