
var os = require('os');
var base = require('base');

exports.Parser = function () {
    this._options = [];
    this._def = {};
    this._long = {};
    this._short = {};
};

exports.Parser.prototype.option = function () {
    var self = this;
    var option = new exports.Option(this, arguments);
    option._short.forEach(function (name) {
        self._short[name] = option;
    });
    option._long.forEach(function (name) {
        self._long[name] = option;
    });
    this._options.push(option);

    this.printHelp = this.printHelp.bind(this);

    return option;
};

exports.Parser.prototype.def = function (name, value) {
    this._def[name] = value;
    return this;
};

exports.Parser.prototype.usage = function (usage) {
    this._usage = usage;
    return this;
};

exports.Parser.prototype.help = function (help) {
    this._help = help;
    return this;
};

exports.Parser.prototype.printHelp = function (parse) {
    var self = this;
    this.print(
        'Usage: ' + parse.command + ' [options] ' + 
        (this._usage || '')
    );
    if (this._help)
        this.print(this._help);
    this._options.forEach(function (option) {
        if (option._hidden)
            return;
        var message = [' '];
        if (option._short.length)
            message.push(option._short.map(function (_short) {
                return ' -' + _short;
            }).join(''));
        if (option._long.length)
            message.push(option._long.map(function (_long) {
                return ' --' + _long;
            }).join(''));
        if (option._action.length > 2)
            message.push(
                ' ' +
                base.range(option._action.length - 2)
                .map(function () {
                    return option._name || option._long || '___';
                }).join(' ')
            );
        if (option._help)
            message.push(': ' + option._help);
        if (option._choices) {
            var choices = option._choices;
            if (!Array.isArray(choices))
                choices = base.keys(choices);
            message.push(' (' + choices.join(', ') + ')');
        }
        if (option._halt)
            message.push(' (final option)');
        self.print(message.join(''));
    });
    this.exit();
};

exports.Parser.prototype.exit = function () {
    os.exit();
};

exports.Parser.prototype.print = function () {
    print.apply(null, arguments);
};

exports.Parser.prototype.parse = function (args) {
    var self = this;

    if (!args)
        args = system.args;

    var parse = {
        args: args,
        options: {}
    };

    if (args.length && !/^-/.test(args[0]))
        parse.options.command = args.shift();

    function mandatoryShift(n, name) {
        if (n > parse.args.length) {
            this.print(
                'ERROR: The ' + base.enquote(name) +
                ' option requires ' + n + ' arguments.'
            );
            this.printHelp(parse);
        }
        return parse.args.shift(n);
    };

    function validate (option, value) {
        try {
            return option._validate(value);
        } catch (exception) {
            self.print('ERROR: ' + exception);
            self.printHelp(parse);
        }
    };

    // initial values
    for (var name in this._def) {
        if (base.has(this._def, name))
            parse.options[name] = base.copy(this._def[name]);
    }
    this._options.forEach(function (option) {
        parse.options[option._name] = option._def;
    });

    // walk args
    ARGS: while (parse.args.length) {
        var arg = parse.args.shift();
        if (arg == "--") {
            break;

        } else if (/^--/.test(arg)) {

            var pattern = arg.match(/^--([^=]+)(?:=(.*))?/).slice(1);
            var word = pattern[0];
            var value = pattern[1];

            if (!!value) {
                parse.args.unshift(value);
            }

            if (base.has(this._long, word)) {

                var option = this._long[word];
                if (option._action.length > 2) {
                    option._action.apply(
                        parse,
                        [
                            parse.options,
                            option._name
                        ].concat(
                            validate(option, mandatoryShift.call(
                                this,
                                Math.max(0, option._action.length - 2),
                                word
                            ))
                        )
                    );
                } else {
                    option._action.call(
                        parse,
                        parse.options,
                        option._name
                    );
                }

                if (option._halt)
                    break ARGS;

            } else {
                this.print('ERROR: Unrecognized option: ' + base.enquote(word));
                this.printHelp(parse)
            }

        } else if (/^-/.test(arg)) {

            var letters = arg.match(/^-(.*)/)[1].split('');
            while (letters.length) {
                var letter = letters.shift();
                if (base.has(this._short, letter)) {
                    var option = this._short[letter];
                    if (option._action.length > 2) {
                        if (letters.length) {
                            option._action.call(
                                parse,
                                parse.options,
                                option._name,
                                validate(option, letters.join(''))
                            );
                            letters = '';
                        } else {
                            option._action.apply(
                                parse,
                                [
                                    parse.options,
                                    option._name,
                                ].concat(
                                    validate(option, parse.args.shift(option._action.length - 2))
                                )
                            );
                        }
                    } else {
                        option._action.call(parse, parse.options, option._name);
                    }

                    if (option._halt)
                        break ARGS;

                } else {
                    this.print('ERROR: unrecognized option: ' + base.enquote(letter));
                    this.printHelp(parse);
                }
            }

        } else {
            parse.args.unshift(arg);
            break;
        }

    }

    return parse.options;
};

exports.Option = function (parser, names) {
    var self = this;
    this._parser = parser;
    this._validate = function (value) {
        return value;
    };
    this._long = [];
    this._short = [];
    base.forEach(names, function (name) {
        if (/^--/.test(name)) {
            name = name.match(/^--(.*)/)[1];
            self._long.push(name);
        } else if (/^-.$/.test(name)) {
            name = name.match(/^-(.)/)[1];
            self._short.push(name);
        } else if (/^-/.test(name)) {
            throw new Error("option names with one dash can only have one letter.");
        } else {
            self._name = name;
        }
    });
    return this;
};

exports.Option.prototype.action = function (action) {
    this._action = action;
    return this;
};

exports.Option.prototype.set = function (value) {
    var option = this;
    if (arguments.length == 0)
        return this.action(function (options, name, value) {
            options[name] = value;
        });
    else if (arguments.length == 1)
        return this.action(function (options, name) {
            options[name] = value;
        });
    else
        throw new Error("Option().set takes 0 or 1 arguments");
};

exports.Option.prototype.push = function () {
    var option = this;
    return this.def([]).action(function (options, name, value) {
        this.options[option._name].push(option._validate(value));
    });
};

exports.Option.prototype.inc = function () {
    if (!base.has(this, '_def'))
        this._def = 0;
    var option = this;
    return this.action(function (options, name) {
        options[name]++;
    });
};

exports.Option.prototype.dec = function () {
    if (!base.has(this, '_def'))
        this._def = 0;
    var option = this;
    return this.action(function (options, name) {
        options[name]--;
    });
};

exports.Option.prototype.choices = function (choices) {
    this.set();
    this._choices = choices;
    if (Array.isArray(choices)) {
        return this.validate(function (value) {
            if (choices.indexOf(value) < 0)
                throw new Error("choice invalid"); // TODO
            return value;
        })
    } else {
        return this.validate(function (value) {
            if (!base.has(choices, value))
                throw new Error("choice invalid"); // TODO
            return choices[value];
        });
    }
};

exports.Option.prototype.def = function (value) {
    this._def = value;
    return this;
};

exports.Option.prototype.validate = function (validate) {
    this._validate = validate;
    return this;
};

exports.Option.prototype.input = function () {
    this.set().validate(function (value) {
        if (value == "-")
            return system.stdin;
        else
            return system.fs.open(value, 'r');
    });
};

exports.Option.prototype.output = function () {
    this.set().validate(function (value) {
        if (value == "-")
            return system.stdout;
        else
            return system.fs.open(value, 'w');
    });
};

exports.Option.prototype.number = function () {
    return this.validate(function (value) {
        var result = +value;
        if (result == NaN)
            throw new Error("not a number");
        return result;
    });
};

exports.Option.prototype.octal = function () {
    return this.validate(function (value) {
        var result = parseInt(value, 8);
        if (result == 0 && +value !== 0)
            throw new Error("not an octal value");
        return result;
    });
};

exports.Option.prototype.integer = function () {
    return this.validate(function (value) {
        var result = value >>> 0;
        if (result !== value)
            throw new Error("not an integer");
        return result;
    });
};

exports.Option.prototype.natural = function () {
    return this.validate(function (value) {
        var result = value >>> 0;
        if (result !== +value || result < 0)
            throw new Error("not a natural number");
        return result;
    });
};

exports.Option.prototype.whole = function () {
    return this.validate(function (value) {
        var result = value >>> 0;
        if (result !== +value || result < 1)
            throw new Error("not a whole number");
        return result;
    });
};

exports.Option.prototype.help = function (text) {
    this._help = text;
    return this;
};

exports.Option.prototype.halt = function () {
    this._halt = true;
    return this;
};

exports.Option.prototype.hidden = function () {
    this._hidden = true;
    return this;
};

exports.Option.prototype.end = function () {
    return this._parser;
};

exports.Option.prototype.option = function () {
    return this.end().option.apply(this, arguments);
};

