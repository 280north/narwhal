
var os = require('os');
var base = require('base');

exports.parse = function (options, args) {
    return new exports.Parser(options).parse(args);
};

exports.Parser = function (options) {
    var self = this;
    this._options = [];
    this._def = {};
    this._long = {};
    this._short = {};
    this.Option = exports.Option;

    // apply options if they exist
    if (!base.isArrayLike(options))
        options = base.items(options);
    base.forEachApply(options, function (name, value) {
        self[name](value);
    });
};

exports.Parser.prototype.options = function (options) {
    // for adding an array of option objects
    var self = this;
    options.forEach(function (option) {
        self.option(option);
    });
    return this;
};

exports.Parser.prototype.option = function () {
    var self = this;
    var option = new this.Option(this, arguments);
    this._options.push(option);
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

exports.Parser.prototype.printHelp = function (options) {
    var self = this;
    this.print(
        'Usage: ' + options.command + ' [options] ' + 
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
            if (!base.isArrayLike(choices))
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

    var options = {};
    options.args = args;
    if (args.length && !/^-/.test(args[0]))
        options.command = args.shift();

    function mandatoryShift(n, name) {
        if (n > args.length) {
            this.print(
                'ERROR: The ' + base.enquote(name) +
                ' option requires ' + n + ' arguments.'
            );
            this.printHelp(options);
        }
        return args.shift(n);
    };

    function validate (option, value) {
        try {
            return option._validate(value);
        } catch (exception) {
            self.print('ERROR: ' + exception);
            self.printHelp(options);
        }
    };

    // initial values
    for (var name in this._def) {
        if (base.has(this._def, name))
            options[name] = base.copy(this._def[name]);
    }
    this._options.forEach(function (option) {
        options[option._name] = option._def;
    });

    // walk args
    ARGS: while (args.length) {
        var arg = args.shift();
        if (arg == "--") {
            break;

        } else if (/^--/.test(arg)) {

            var pattern = arg.match(/^--([^=]+)(?:=(.*))?/).slice(1);
            var word = pattern[0];
            var value = pattern[1];

            if (!!value) {
                args.unshift(value);
            }

            if (base.has(this._long, word)) {

                var option = this._long[word];
                if (option._action.length > 2) {
                    option._action.apply(
                        self,
                        [
                            options,
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
                        self,
                        options,
                        option._name
                    );
                }

                if (option._halt)
                    break ARGS;

            } else {
                this.print('ERROR: Unrecognized option: ' + base.enquote(word));
                this.printHelp(options)
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
                                self,
                                options,
                                option._name,
                                validate(option, letters.join(''))
                            );
                            letters = '';
                        } else {
                            option._action.apply(
                                self,
                                [
                                    options,
                                    option._name,
                                ].concat(
                                    validate(option, args.shift(option._action.length - 2))
                                )
                            );
                        }
                    } else {
                        option._action.call(self, options, option._name);
                    }

                    if (option._halt)
                        break ARGS;

                } else {
                    this.print('ERROR: unrecognized option: ' + base.enquote(letter));
                    this.printHelp(options);
                }
            }

        } else {
            args.unshift(arg);
            break;
        }

    }

    return options;
};

exports.Option = function (parser, args) {
    var self = this;
    this._parser = parser;
    this._validate = function (value) {
        return value;
    };
    this._long = [];
    this._short = [];
    base.forEach(args, function (arg) {
        if (typeof arg == "function") {
            self.action(arg);
        } else if (typeof arg !== "string") {
            for (var name in arg) {
                var value = arg[name];
                self[name](value);
            }
        } else if (/ /.test(arg)) {
            self.help(arg);
        } else if (/^--/.test(arg)) {
            arg = arg.match(/^--(.*)/)[1];
            self.__(arg);
        } else if (/^-.$/.test(arg)) {
            arg = arg.match(/^-(.)/)[1];
            self._(arg);
        } else if (/^-/.test(arg)) {
            throw new Error("option names with one dash can only have one letter.");
        } else {
            self.name(arg);
        }
    });
    return this;
};

exports.Option.prototype._ = function (letter) {
    this._short.push(letter);
    this._parser._short[letter] = this;
    return this;
};

exports.Option.prototype.__ = function (word) {
    this._long.push(word);
    this._parser._long[word] = this;
    return this;
};

exports.Option.prototype.name = function (name) {
    this._name = name;
    return this;
};

exports.Option.prototype.action = function (action) {
    var self = this;
    if (typeof action == "string") {
        this._action = self._parser[action];
    } else {
        this._action = action;
        return this;
    }
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
    if (base.isArrayLike(choices)) {
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

exports.Option.prototype.hex = function () {
    return this.validate(function (value) {
        var result = parseInt(value, 16);
        if (result == 0 && +value !== 0)
            throw new Error("not an hex value");
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

