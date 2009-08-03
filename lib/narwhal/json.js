
var args = require("args");
var assert = require("test/assert");
var util = require("util");

var parser = new args.Parser();

parser.help('a tool for working with json and other data');

parser.option('-i', '--file-in', 'name', 'fileIn').set();

var inputGroup = parser.group('input (either or neither)');

inputGroup.option('-n', '--read-lines')
    .action(function (options, name) {
        if (!options.read)
            options.read = "lines";
        else
            options.todo.push(["lines"]);
    });

inputGroup.option('-N', '--read-all')
    .action(function (options, name) {
        if (!options.read)
            options.read = "all";
        else
            options.todo.push(["all"]);
    });

var actionGroup = parser.group('actions');

actionGroup.option('-}', '--json-in', 'jsonIn')
    .help('JSON.decode(_)')
    .todo();

actionGroup.option('-d', '--delimiter-in', 'delimiter', 'delimiterIn')
    .help('split(_)')
    .todo('delimiterIn', 'delimiter');

actionGroup.option('-e', '--execute', 'statement', 'execute')
    .todo('execute', 'statement')
    .help('execute a statement');
actionGroup.option('-x', '--evaluate', 'expression', 'evaluate')
    .help('evaluate an expression')
    .todo('evaluate', 'expression');
actionGroup.option('-$', '--json-path', 'expression')
    .help('jsonpath.resolve(_, expression)')
    .todo('jsonpath', 'expression');

actionGroup.option('-]', '-a', '--array-in', 'arrayIn')
    .help('[array(_)]')
    .todo();
actionGroup.option('-[', '-A', '--array-out', 'arrayOut')
    .help('concat.apply(_)')
    .todo();

actionGroup.option('-l', '--lambda', 'names', 'expression')
    .help('evaluates expressions from named positions in an array')
    .action(function (options, name, names, expression) {
        options.todo.push(['lambda', Function.constructor.apply(
            null,
            names.split(',').concat(['return (' + expression + ')'])
        )]);
    });

actionGroup.option('-f', '--array-fields', 'names', 'fields')
    .help('selects fields from objects or arrays')
    .todo('fields', 'fields');
actionGroup.option('-F', '--object-fields', 'names', 'object')
    .help('creates objects from arrays')
    .todo('object', 'names');

actionGroup.option('-{', '--json-out', 'jsonOut')
    .help('JSON.encode(_)')
    .todo();

actionGroup.option('-D', '--delimiter-out', 'delimiter', 'delimiterOut')
    .help('join(_)')
    .todo('delimiterOut', 'delimiter');

var outputGroup = parser.group('output (either or neither)');
outputGroup.option('-p', '--print-lines', 'print').set('lines');
outputGroup.option('-P', '--print-all', 'print').set('all');

parser.option('-o', '--file-out', 'name', 'fileOut').set();

parser.option('-0', '--read0', 'read0')
    .help('read null terminated strings')
    .set(true);
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

    var _;

    if (options.fileIn)
        _ = system.fs.open(options.fileIn);
    else
        _ = system.stdin;

    if (options.read0)
        _ = require("io").StringIO(_.read(), "\0");

    // noop, read-all, read-iter
    if (options.read == "all")
        _ = _.read();

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

actions.execute = function (_, options, statement) {
    return block(_, options.read == "lines", function (_) {
        global._ = _;
        return system.evalGlobal(statement);
    });
};

actions.evaluate = function (_, options, expression) {
    return block(_, options.read == "lines", function (_) {
        global._ = _;
        return system.evalGlobal('(' + expression + ')');
    });
};

actions.jsonpath = function (_, options, expression) {
    return block(_, options.read == "lines", function (_) {
        return require('jsonpath').resolve(_, expression);
    });
};

actions.arrayIn = function (_, options) {
    var result = [];
    if (!_.forEach)
        throw new args.UsageError("-] must receive values that implement .forEach");
    _.forEach(function (_) {
        result.push(_);
    });
    return [result];
};

actions.arrayOut = function (_, options) {
    return Array.prototype.concat.apply([], _);
};

actions.lambda = function (_, options, lambda) {
    return block(_, options.print == "lines", function (_) {
        return lambda.apply(null, _);
    });
};

actions.fields = function (_, options, fields) {
    fields = fields.split(",");
    return block(_, options.read == "lines", function (_) {
        return fields.map(function (field) {
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

exports.validate = function (options) {
    if (options.jsonIn) {
        if (!options.read)
            throw new args.UsageError("JSON parsing requires input via -n or -N");
    }
};

var block = function (_, condition, block) {
    if (condition) {
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
    try {
        exports.validate(options);
    } catch (error) {
        print(error.message);
        require("os").exit(-1);
    }
    exports.pipeline(options);
};

