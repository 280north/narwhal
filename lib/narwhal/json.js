
var os = require("os");
var args = require("args");
var assert = require("test/assert");
var util = require("util");

var parser = new args.Parser();

parser.help(
    'a tool for working with json and other data\n' + 
    'options get executed in order, on a _ register\n' +
    'or on each value in the register.'
);

parser.option('-i', '--file-in', 'name')
    .help('open(NAME)')
    .action(function (options, name, fileName) {
        options._ = system.fs.open(fileName);
    });

parser.option('-o', '--file-out', 'name', 'fileOut')
    .help('write(NAME, _)')
    .action(function (options, name, fileName) {
        options.out = system.fs.open(fileName, 'w');
    });

parser.option('-n', '--read-lines', 'mode')
    .help('switches to line register mode (_ is each value in the register)')
    .set('lines');

parser.option('-N', '--read-all', 'mode')
    .help('_.read(), switches to whole register mode (_ is the whole value)')
    .action(function (options, name) {
        options.mode = 'all';
        if (options._.read && !Object.hasOwnProperty.call(options._, 'read'))
            options._ = options._.read();
    });

parser.option('-j', '-}', '--json-in', 'jsonIn')
    .help('JSON.decode(_)')
    .action(function (options) {
        options._ = block(options._, options.mode, function (_) {
            if (!typeof _ == "string") {
                system.stderr.print("JSON can only decode strings.");
                os.exit(-1);
            }
            return JSON.decode(_);
        });
    });

parser.option('-d', '--delimiter-in', 'delimiter', 'delimiterIn')
    .help('split(_, DELIMITER)')
    .action(function (options, name, delimiter) {
        // todo switch between regex and literal mode with -E
        var regex = new RegExp(delimiter, 'g');
        options._ = block(options._, options.mode, function (_) {
            return ('' + _).split(regex);
        });
    });

parser.option('-e', '--evaluate', 'expression')
    .help('evaluate an expression')
    .action(function (options, name, expression) {
        options._ = block(options._, options.mode, function (_) {
            global._ = _;
            return system.evalGlobal('(' + expression + ')');
        });
    });

parser.option('-x', '--execute', 'statement')
    .help('execute a statement')
    .action(function (options, name, statement) {
        options._ = block(options._, options.mode, function (_) {
            global._ = _;
            system.evalGlobal(statement);
            return global._;
        });
    });

parser.option('-$', '--json-path', 'path')
    .help('jsonpath.resolve(_, PATH)')
    .action(function (options, name, path) {
        options._ = block(options._, options.mode, function (_) {
            return require('jsonpath').resolve(_, path);
        });
    });

parser.option('-]', '-a', '--array-in', 'arrayIn')
    .help('[array(_)]')
    .action(function (options) {
        options._ = [array(options._)];
    });

parser.option('-[', '-A', '--array-out', 'arrayOut')
    .help('concat.apply(_)')
    .action(function (options) {
        options._ = Array.prototype.concat.apply([], options._);
    });

parser.option('-f', '--array-fields', 'names', 'fields')
    .help('selects fields from objects or arrays (first is -f 1)')
    .action(function (options, name, fields) {
        fields = fields.split(",");
        options._ = block(options._, options.mode, function (_) {
            return fields.map(function (field) {
                if (field == "_")
                    return _;
                if (field >>> 0 === field)
                    return _[field >>> 0 - 1];
                return _[field];
            });
        });
    });

parser.option('-F', '--object-fields', 'names', 'object')
    .help('converts array indexes to object keys')
    .action(function (options, name, fields) {
        var fields = fields.split(",");
        options._ = block(options._, options.mode, function (_) {
            return util.object(util.zip(fields, _));
        });
    });

parser.option('-l', '--lambda', 'names', 'expression')
    .help('evaluates expressions from named positions in an array')
    .action(function (options, name, names, expression) {
        var lambda = Function.constructor.apply(
            null,
            ['_'].concat(names.split(',')).concat(['return (' + expression + ')'])
        );
        options._ = block(options._, options.mode, function (_) {
            return lambda.apply(null, [_].concat(_));
        });
    });

parser.option('-O', '--object')
    .help('converts [name,value] pairs to {name:value} object')
    .action(function (options) {
        options._ = block(options._, options.mode, function (_) {
            return util.object(_);
        });
    });

parser.option('-J', '-{', '--json-out', 'jsonOut')
    .help('JSON.encode(_)')
    .action(function (options) {
        options._ = block(options._, options.mode, function (_) {
            if (
                !util.no(_) &&
                _.forEach &&
                !Object.prototype.hasOwnProperty.call(_, 'forEach')
            )
                _ = array(_);
            if (options.tabWidth !== undefined)
                return JSON.encode(_, null, options.tabWidth>>>0);
            else
                return JSON.encode(_);
        });
    });

parser.option('-D', '--delimiter-out', 'delimiter', 'delimiterOut')
    .help('join(_, DELIMITER)')
    .action(function (options, name, delimiter) {
        options._ = block(options._, options.mode, function (_) {
            return _.join(delimiter);
        });
    });

parser.option('-p', '--print-lines', 'print')
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
    .action(function (options) {
        if (options.print0)
            options.out.write('' + options._ + '\0');
        else
            options.out.print('' + options._);
    });

parser.option('-0', '--read0', 'read0')
    .help('read null terminated strings')
    .action(function (options, name) {
        // trim a final end of line if there is one
        // (find -print0 writes one)
        var content = options._.read().replace(/\0(\r\n?|\n)$/, '');
        options._ = require("io").StringIO(content, "\0");
    });

parser.option('-z', '--print0', 'print0')
    .help('print null terminated strings')
    .set(true);

parser.option('-t', '--tab-width', 'tab-width', 'tabWidth')
    .help('use pretty print with a given tab width')
    .set();

parser.option('-T', '--pretty', 'tab-width', 'tabWidth')
    .help('use pretty print with default tab width of 4')
    .set(4);

parser.helpful();

var array = function (_) {
    var result = [];
    if (!_.forEach) {
        system.stderr.print('ERROR: cannot convert ' + util.repr(_) + ' to array.');
        os.exit(-1);
    }
    _.forEach(function (_) {
        result.push(_);
    });
    return result;
};

var block = function (_, mode, block) {
    if (mode == "lines") {
        if (typeof _ == "string") {
            system.stderr.print('ERROR: Cannot operate on strings in line mode.');
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
    options.out = system.stdout;
    parser.parse(system.args, options);
    if (typeof options._ == "number")
        os.exit(options._);
};

