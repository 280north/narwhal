
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var os = require("os");
var args = require("narwhal/args");
var assert = require("test/assert");
var util = require("narwhal/util");
var system = require("system");
var fs = require("file");

var parser = new args.Parser();

// syntax highlighting for option help
parser.Option = function () {
    args.Option.apply(this, arguments);
    return this;
};
parser.Option.prototype = Object.create(args.Option.prototype);
parser.Option.prototype.help = function (help) {
    if (/->/.test(help)) {
        help = help.replace(/\b[a-z]+\b/g, function (all) {
            return '\0cyan(' + all + '\0)';
        }).replace(/\b[A-Z]+\b/g, function (all) {
            return '\0green(' + all + '\0)';
        }).replace(/"[^"]+"/g, function (all) {
            return '\0red(' + all + '\0)';
        }).replace(/_/g, function (all) {
            return '\0green(\0bold(' + all + '\0)\0)';
        }).replace(/->|;/g, function (all) {
            return '\0red(' + all + '\0)';
        })
    }
    return args.Option.prototype.help.call(this, help);
};

parser.help(
    'A tool for working with JSON and other data.\n' + 
    'Options get executed in order, on a register\n' +
    'or on each value in the register iteratively.'
);

parser.option('-i', '--file-in', 'name')
    .help('open(NAME) -> _')
    .action(function (options, name, fileName) {
        options._ = fs.open(fileName);
    });

parser.option('-o', '--file-out', 'name', 'fileOut')
    .help('write(NAME, _); _ -> _')
    .action(function (options, name, fileName) {
        options.out = fs.open(fileName, 'w');
    });

parser.option('-n', '--read-lines', 'mode')
    .help('switches to line register mode; _ is each value in the register')
    .set('lines');

parser.option('-N', '--read-all', 'mode')
    .help('switches to whole register mode; _ is the whole value')
    .action(function (options, name) {
        options.mode = 'all';
        /*if (options._.read && !Object.hasOwnProperty.call(options._, 'read'))
            options._ = options._.read();
            */
    });

parser.option('-j', '-}', '--json-in', 'jsonIn')
    .help('json.decode(_) -> _')
    .action(function (options) {
        options._ = block(options._, options.mode, function (_) {
            if (!typeof _ == "string") {
                system.stderr.print("JSON can only decode strings.");
                os.exit(-1);
            }
            // consume strems before reading
            _ = read(_);
            return JSON.decode(_);
        });
    });

parser.option('-J', '-{', '--json-out', 'jsonOut')
    .help('json.encode(_) -> _')
    .action(function (options) {
        options._ = collect(options._);
        options._ = block(options._, options.mode, function (_) {
            _ = collect(_);
            return JSON.encode(_, null, options.tabWidth);
        });
    });

parser.option('-t', '--tab-width', 'tab-width', 'tabWidth')
    .help('use pretty print with a given tab width')
    .set();

parser.option('-T', '--pretty', 'tab-width', 'tabWidth')
    .help('use pretty print with default tab width of 4')
    .set(4);

parser.option('-$', '--json-path', 'path')
    .help('jsonpath.resolve(_, PATH) -> _')
    .action(function (options, name, path) {
        options._ = require('jsonpath').resolve(options._, path);
    });

parser.option('-c', '--array-collect')
    .help('array(_) -> _')
    .action(function (options) {
        options._ = collect(options._);
    });

parser.option('-]', '-a', '--array-wrap')
    .help('[array(_)] -> _')
    .action(function (options) {
            // TODO convert strams to arrays
        options._ = [options._];
    });

parser.option('-[', '-A', '--array-unwrap')
    .help('concat(_, _, _, ...) -> _')
    .action(function (options) {
        options._ = Array.prototype.concat.apply([], options._);
    });

parser.option('-O', '--array2object', '--a2o')
    .help('converts [name,value] pairs to {name:value} object')
    .action(function (options) {
        options._ = collect(options._)
        options._ = block(options._, options.mode, function (_) {
            return util.object(_);
        });
    });

parser.option('-X', '--object2array', '--o2a')
    .help('converts {name:value} object to [name,value] pairs')
    .action(function (options) {
        options._ = block(options._, options.mode, function (_) {
            return util.array(_);
        });
    });

parser.option('-d', '--delimiter-in', 'delimiter')
    .help('split(_, DELIMITER) -> _')
    .action(function (options, name, delimiter) {
        // todo switch between regex and literal mode with -E
        var regex = new RegExp(RegExp.escape(delimiter), 'g');
        options._ = block(options._, options.mode, function (_) {
            return ('' + _).split(regex);
        });
    });

parser.option('-D', '--delimiter-out', 'delimiter', 'delimiterOut')
    .help('join(_, DELIMITER) -> _')
    .action(function (options, name, delimiter) {
        options._ = block(options._, options.mode, function (_) {
            return collect(_).join(delimiter);
        });
    });

parser.option('-f', '-.', '--array-fields', 'names', 'fields')
    .help('selects fields from objects or arrays (first is -f 1)')
    .action(function (options, name, fields) {
        fields = fields.split(",");
        options._ = block(options._, options.mode, function (_) {
            return fields.map(function (field) {
                if (field == "_")
                    return _;
                if ('' + (field >>> 0) === field)
                    return _[(field >>> 0) - 1];
                return _[field];
            });
        });
    });

parser.option('-F', '--object-fields', 'names')
    .help('converts array indexes to object keys')
    .action(function (options, name, fields) {
        var fields = fields.split(",");
        options._ = block(options._, options.mode, function (_) {
            return util.object(util.zip(fields, _));
        });
    });

parser.option('-l', '--lambda', 'names', 'expression')
    .help('(function (NAMES) EXPRESSION)(_) -> _')
    .action(function (options, name, names, expression) {
        var lambda = Function.constructor.apply(
            null,
            ['_'].concat(names.split(',')).concat(['return (' + expression + ')'])
        );
        options._ = block(options._, options.mode, function (_) {
            return lambda.apply(null, [_].concat(_));
        });
    });

parser.option('-e', '--evaluate', 'expression')
    .help('eval(EXPRESSION)) -> _')
    .action(function (options, name, expression) {
        options._ = block(options._, options.mode, function (_) {
            global._ = _;
            return system.evalGlobal(expression);
        });
    });

parser.option('-v', '--value', 'expression')
    .help('eval("("+EXPRESSION+")") -> _')
    .action(function (options, name, expression) {
        options._ = block(options._, options.mode, function (_) {
            global._ = _;
            return system.evalGlobal('(' + expression + ')');
        });
    });

parser.option('-x', '--execute', 'statement')
    .help('eval(STATEMENT); _ -> _')
    .action(function (options, name, statement) {
        options._ = block(options._, options.mode, function (_) {
            global._ = _;
            system.evalGlobal(statement);
            return global._;
        });
    });

parser.option('-w', '--where', 'expression')
    .help('if (EXPRESSION) _ -> _')
    .action(function (options, name, expression) {
        var results = [];
        options._.forEach(function (_) {
            global._ = _;
            if (system.evalGlobal(expression))
                results.push(_);
        });
        options._ = results;
    })

parser.option('-p', '--print-lines', 'print')
    .help('_.forEach(print); _ -> _')
    .action(function (options) {
        block(options._, options.mode, function (_) {
            if (options.print0)
                options.out.write('' + _ + '\0');
            else
                options.out.print('' + _);
        });
        if (options.print0)
            options.out.flush();
    });

parser.option('-P', '--print-all', 'print')
    .help('print(_); _ -> _')
    .action(function (options) {
        options._ = collect(options._);
        if (options.print0)
            options.out.write('' + options._ + '\0');
        else
            options.out.print('' + options._);
    });

parser.option('-0', '--read0', 'read0')
    .help('read null terminated strings from streams with -N')
    .action(function (options) {
        // trim a final end of line if there is one
        // (find -print0 writes one)
        var content = options._.read().replace(/\0(\r\n?|\n)$/, '');
        options._ = require("io").StringIO(content, "\0");
    });

parser.option('-z', '--print0', 'print0')
    .help('print null terminated strings to streams with -p')
    .set(true);

parser.helpful();

var read = function (_) {
    if (_.read && !Object.prototype.hasOwnProperty.call(_, 'read')) {
        return _.read();
    } else {
        return _;
    }
};

var collect = function (_) {
    if (
        !util.no(_) &&
        _.forEach &&
        !Object.prototype.hasOwnProperty.call(_, 'forEach') &&
        typeof _ != "string" // deprecated
    ) {
        var result = [];
        _.forEach(function (_) {
            result.push(_);
        });
        return result;
    } else {
        return _;
    }
};

var block = function (_, mode, block) {
    if (mode == "lines") {
        if (typeof _ == "string") {
            system.stderr.print("Cannot operate on strings in line mode.");
            os.exit(-1);
        }
        var result = [];
        _.forEach(function (_) {
            result.push(block(_));
        });
        return result;
    } else {
        return block(_);
    }
};

exports.main = function (system) {
    var options = {};
    options._ = system.stdin;
    options.mode = "all";
    options.out = system.stdout;
    parser.parse(system.args, options);
    if (typeof options._ == "number")
        os.exit(options._);
};

if (require.main == module.id)
    exports.main(system);

