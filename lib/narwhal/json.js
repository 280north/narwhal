
var args = require("args");
var assert = require("test/assert");
var util = require("util");

var parser = new args.Parser();

parser.help('a tool for working with json and other data');

parser.option('-i', '--file-in', 'name', 'fileIn')
    .todo('fileIn', 'name');

parser.option('-o', '--file-out', 'name', 'fileOut').set();

parser.option('-n', '--read-lines', 'read')
    .todo('readLines');

parser.option('-N', '--read-all', 'read')
    .todo('readAll');

parser.option('-*', '--lines')
    .todo('lines');

parser.option('-1', '--all')
    .todo('all');

parser.option('-}', '--json-in', 'jsonIn')
    .help('JSON.decode(_)')
    .todo();

parser.option('-d', '--delimiter-in', 'delimiter', 'delimiterIn')
    .help('split(_)')
    .todo('delimiterIn', 'delimiter');

parser.option('-e', '--evaluate', 'expression')
    .help('evaluate an expression')
    .todo('evaluate', 'expression');

parser.option('-x', '--execute', 'statement')
    .help('execute a statement')
    .todo('execute', 'statement');

parser.option('-$', '--json-path', 'expression')
    .help('jsonpath.resolve(_, expression)')
    .todo('jsonpath', 'expression');

parser.option('-]', '-a', '--array-in', 'arrayIn')
    .help('[array(_)]')
    .todo();

parser.option('-[', '-A', '--array-out', 'arrayOut')
    .help('concat.apply(_)')
    .todo();

parser.option('-l', '--lambda', 'names', 'expression')
    .help('evaluates expressions from named positions in an array')
    .action(function (options, name, names, expression) {
        options.todo.push(['lambda', Function.constructor.apply(
            null,
            ['_'].concat(names.split(',')).concat(['return (' + expression + ')'])
        )]);
    });

parser.option('-f', '--array-fields', 'names', 'fields')
    .help('selects fields from objects or arrays')
    .todo('fields', 'fields');

parser.option('-F', '--object-fields', 'names', 'object')
    .help('converts array indexes to object keys')
    .todo('object', 'names');

parser.option('-O', '--object')
    .help('converts [name,value] pairs to {name:value} object')
    .todo('array2object');

parser.option('-{', '--json-out', 'jsonOut')
    .help('JSON.encode(_)')
    .todo();

parser.option('-D', '--delimiter-out', 'delimiter', 'delimiterOut')
    .help('join(_)')
    .todo('delimiterOut', 'delimiter');

parser.option('-p', '--print-lines', 'print')
    .set('lines');

parser.option('-P', '--print-all', 'print')
    .set('all');

parser.option('-0', '--read0', 'read0')
    .help('read null terminated strings')
    .todo('read0');

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

exports.pipeline = function (options) {

    var _ = system.stdin;

    // ordered commands
    util.forEachApply(options.todo, function (command, option) {
        _  = actions[command](_, options, option);
    });

    var out;
    if (options.fileOut)
        out = system.fs.open(options.fileOut, 'w');
    else
        out = system.stdout;

    if (options.print)
        block(_, options.print == "lines", function (_) {
            if (options.print0)
                out.write('' + _ + '\0');
            else
                out.print('' + _);
        });

    if (options.print0)
        out.flush();

};

var actions = {};

actions.fileIn = function (_, options, name) {
    return system.fs.open(name);
};

actions.readLines = function (_, options) {
    options.read = "lines";
    return _;
};

actions.readAll = function (_, options) {
    options.read = "all";
    return _.read();
};

actions.read0 = function (_, options) {
    return require("io").StringIO(_.read().replace(/\0(\r\n?|\n)$/, ''), "\0");
};

actions.all = function (_, options) {
    options.read = "all";
    return _;
};

actions.lines = function (_, options) {
    options.read = "lines";
    return _;
};


actions.all = function (_, options) {
    options.read = "all";
    return _;
};

actions.jsonIn = function (_, options) {
    return block(_, options.read == "lines", JSON.decode);
};

actions.jsonOut = function (_, options) {
    return block(_, options.print == "lines", function (_) {
        if (_.forEach && !Object.prototype.hasOwnProperty.call(_, 'forEach'))
            _ = array(_);
        if (options.tabWidth !== undefined)
            return JSON.encode(_, null, options.tabWidth>>>0);
        else
            return JSON.encode(_);
    });
};

actions.delimiterIn = function (_, options, delimiter) {
    var regex = new RegExp(delimiter, 'g');
    return block(_, options.read == "lines", function (_) {
        return ('' + _).split(regex);
    });
};

actions.delimiterOut = function (_, options, delimiter) {
    return block(_, options.print == "lines", function (_) {
        return _.join(delimiter);
    });
};

actions.evaluate = function (_, options, expression) {
    return block(_, options.read == "lines", function (_) {
        global._ = _;
        return system.evalGlobal('(' + expression + ')');
    });
};

actions.execute = function (_, options, statement) {
    return block(_, options.read == "lines", function (_) {
        global._ = _;
        system.evalGlobal(statement);
        return global._;
    });
};

actions.jsonpath = function (_, options, expression) {
    return block(_, options.read == "lines", function (_) {
        return require('jsonpath').resolve(_, expression);
    });
};

var array = function (_) {
    var result = [];
    if (!_.forEach)
        throw new args.UsageError("-] must receive values that implement .forEach");
    _.forEach(function (_) {
        result.push(_);
    });
    return result;
};

actions.arrayIn = function (_, options) {
    return [array(result)];
};

actions.arrayOut = function (_, options) {
    return Array.prototype.concat.apply([], _);
};

actions.lambda = function (_, options, lambda) {
    return block(_, options.print == "lines", function (_) {
        return lambda.apply(null, [_].concat(_));
    });
};

actions.fields = function (_, options, fields) {
    fields = fields.split(",");
    return block(_, options.read == "lines", function (_) {
        return fields.map(function (field) {
            if (field == "_")
                return _;
            if (field >>> 0 === field)
                return _[field >>> 0];
            return _[field];
        });
    });
};

actions.object = function (_, options, fields) {
    var fields = fields.split(",");
    return block(_, options.read == "lines", function (_) {
        return util.object(util.zip(fields, _));
    });
};

actions.array2object = function (_, options) {
    return block(_, options.read == "lines", function (_) {
        return util.object(_);
    });
};

var block = function (_, condition, block) {
    if (condition) {
        if (typeof _ == "string")
            throw new args.UsageError("Use -P on single string values.");
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
    parser.parse(system.args, options);
    exports.pipeline(options);
};

