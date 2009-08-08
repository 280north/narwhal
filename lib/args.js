
var os = require('os');
var util = require('util');
var stream = require('term').stream;
var system = require('system');

exports.UsageError = function (message) {
    this.name = "UsageError";
    this.message = message;
};

exports.UsageError.prototype = new Error();

exports.Parser = function () {
    this._options = [];
    this._def = {};
    this._long = {};
    this._short = {};
    this._commands = {};
    this._args = [];
    this._vargs = undefined;
};

exports.Parser.prototype.option = function () {
    var option = new this.Option(this, arguments);
    this._options.push(option);
    return option;
};

exports.Parser.prototype.group = function (name) {
    var group = new this.Group(this, this, name);
    this._options.push(group);
    return group;
};

exports.Parser.prototype.def = function (name, value) {
    this._def[name] = value;
    return this;
};

exports.Parser.prototype.reset = function (options) {
    for (var name in this._def) {
        if (util.has(this._def, name))
            options[name] = util.copy(this._def[name]);
    }
    this._options.forEach(function (option) {
        options[option._name] = option._def;
    });
};

exports.Parser.prototype.command = function (name, handler) {
    var parent = this;
    if (!handler) {
        var parser = new exports.Parser();
        this._commands[name] = function () {
            return parser;
        };
        return parser;
    } else if (typeof handler == "string") {
        this._commands[name] = function () {
            return require(handler).parser;
        };
        return;
    } else {
        var parser = new this.Parser();
        parser.action(handler);
        this._commands[name] = function () {
            return parser;
        };
        return parser;
    }
};

exports.Parser.prototype.arg = function (name) {
    var argument = new exports.Argument(this).name(name);
    this._args.push(argument);
    return argument;
};

exports.Parser.prototype.args = function (name) {
    var argument = new exports.Argument(this).name(name);
    this._vargs = argument;
    return argument;
};

exports.Parser.prototype.act = function (args, options) {
    if (!this._action) {
        this.error(options, "Not yet implemented.");
        this.exit(-1);
    }
    options.acted = true;
    this._action.call(this, this.parse(args), options);
};

exports.Parser.prototype.action = function (action) {
    if (this._action) {
        action = (function (previous) {
            return function () {
                previous.apply(this, arguments);
                action.apply(this, arguments);
            };
        })(action);
    }
    this._action = action;
    return this;
};

// should be called last
exports.Parser.prototype.helpful = function () {
    var self = this;
    this.option('-h', '--help')
        .help('displays usage information')
        .action(function (options) {
            return self.printHelp(options);
        })
        .halt();
    if (util.len(this._commands))
        this.command('help', function (options) {
            self.printHelp(options);
        }).help('displays usage information');
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
    var args = options.args || [];
    if (args.length) {
        // parse args for deep help
        // TODO offer extended help for options
        if (!util.has(this._commands, args[0])) {
            this.error(options, util.repr(args[0]) + ' is not a command.');
            this.printCommands(options);
            this.exit(options);
        } else {
            util.put(args, 1, '--help');
            this._commands[args[0]]().act(args, options);
            this.exit(options);
        }
    } else {
        this.printUsage(options);
        if (this._help)
            this.print('' + this._help + '');
        this.printCommands(options);
        this.printOptions(options);
        this.exit(options);
    }
};

exports.Parser.prototype.printUsage = function (options) {
    this.print(
        'Usage: \0bold(\0blue(' + system.fs.basename(options.command || '<unknown>') + ' [OPTIONS]' + 
        (util.len(this._commands) ?
            ' COMMAND' :
            ''
        ) + 
        (util.len(this._args) ?
            ' ' + this._args.map(function (arg) {
                if (arg._optional) {
                    return '[' + arg._name.toUpperCase() + ']';
                } else {
                    return arg._name.toUpperCase();
                }
            }).join(' ') :
            ''
        ) +
        (this._vargs ?
            ' [' + this._vargs._name.toUpperCase() + ' ...]':
            ''
        ) + 
        (this._usage ?
            ' ' + this._usage :
            ''
        ) + "\0)\0)"
    );
};

exports.Parser.prototype.printCommands = function (options) {
    var self = this;
    util.forEachApply(
        util.items(this._commands),
        function (name, command) {
            var parser = command();
            self.print('  \0bold(\0green(' + name + '\0)\0)' + (
                parser._help ?
                (
                    ': ' +
                    (
                        parser._action?
                        '': '\0red(NYI\0): '
                    ) + 
                    parser._help
                ) : ''
            ));
        }
    );
};

exports.Parser.prototype.printOption = function (options, option, depth, parent) {
    var self = this;
    depth = depth || 0;
    var indent = util.mul('   ', depth);

    if (option._hidden)
        return;
    if (option._group !== parent)
        return;

    if (option instanceof exports.Group) {
        self.print(indent + ' \0yellow(' + option._name + ':\0)');
        var parent = option;
        option._options.forEach(function (option) {
            return self.printOption(options, option, depth + 1, parent);
        });
        return;
    }

    var message = [];
    if (option._short.length)
        message.push(option._short.map(function (_short) {
            return ' \0bold(\0green(-' + _short + '\0)\0)';
        }).join(''));
    if (option._long.length)
        message.push(option._long.map(function (_long) {
            return ' \0bold(\0green(--' + _long + '\0)\0)';
        }).join(''));
    if (option._action && option._action.length > 2)
        message.push(
            ' ' +
            util.range(option._action.length - 2)
            .map(function () {
                return '\0bold(\0green(' + util.upper(
                    option.getDisplayName()
                ) + '\0)\0)';
            }).join(' ')
        );
    if (option._help)
        message.push(': ' + option._help + '');
    if (option._choices) {
        var choices = option._choices;
        if (!util.isArrayLike(choices))
            choices = util.keys(choices);
        message.push(' \0bold(\0blue((' + choices.join(', ') + ')\0)\0)');
    }
    if (option._halt)
        message.push(' \0bold(\0blue((final option)\0)\0)');
    self.print(indent + message.join(''));

};

exports.Parser.prototype.printOptions = function (options) {
    var self = this;
    self._options.forEach(function (option) {
        self.printOption(options, option);
    });
};

exports.Parser.prototype.error = function (options, message) {
    if (this._parser) {
        this._parser.error.apply(
            this._parser,
            arguments
        );
    } else {
        this.print('\0red(' + message + '\0)');
        this.exit();
    }
};

exports.Parser.prototype.exit = function (status) {
    if (this._parser) {
        this._parser.exit.apply(
            this._parser,
            arguments
        );
    } else {
        os.exit(status);
        throw new Error("exit failed");
    }
};

exports.Parser.prototype.print = function () {
    if (this._parser)
        this._parser.print.apply(
            this._parser,
            arguments
        );
    else
        stream.print.apply(null, arguments);
};

// TODO break this into sub-functions
// TODO wrap with a try catch and print the progress through the arguments
exports.Parser.prototype.parse = function (args, options, noCommand) {
    var self = this;

    if (!args)
        args = system.args;
    if (!options)
        options = {};

    options.args = args;
    if (!noCommand && args.length && !/^-/.test(args[0]))
        options.command = args.shift();

    function mandatoryShift(n, name) {
        if (n > args.length) {
            this.error(
                options,
                'ERROR: The ' + util.enquote(name) +
                ' option requires ' + n + ' arguments.'
            );
        }
        var result = args.slice(0, n);
        for (var i = 0; i < n; i++)
            args.shift()
        return result;
    };

    function validate (option, value) {
        try {
            return option._validate.call(self, value);
        } catch (exception) {
            self.error(options, exception);
        }
    };

    // initial values
    for (var name in this._def) {
        if (util.has(this._def, name) && !util.has(options, name))
            options[name] = util.copy(this._def[name]);
    }
    this._options.forEach(function (option) {
        if (!util.has(options, option._name))
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

            if (util.has(this._long, word)) {

                var option = this._long[word];
                if (!option._action) {
                    self.error(
                        options,
                        "Programmer error: The " + word +
                        " option does not have an associated action."
                    );
                }
                if (option._action.length <= 2) {
                    option._action.call(
                        self,
                        options,
                        option._name
                    );
                } else if (option._action.length <= 3) {
                    option._action.apply(
                        self,
                        [
                            options,
                            option.getName(),
                            validate(option, mandatoryShift.call(
                                this,
                                Math.max(0, option._action.length - 2),
                                word
                            ))
                        ]
                    );
                } else {
                    option._action.apply(
                        self,
                        [
                            options,
                            option.getName()
                        ].concat(
                            validate(option, mandatoryShift.call(
                                this,
                                Math.max(0, option._action.length - 2),
                                word
                            ))
                        )
                    );
                }

                if (option._halt)
                    break ARGS;

            } else {
                this.error(options, 'ERROR: Unrecognized option: ' + util.enquote(word));
            }

        } else if (/^-/.test(arg)) {

            var letters = arg.match(/^-(.*)/)[1].split('');
            while (letters.length) {
                var letter = letters.shift();
                if (util.has(this._short, letter)) {
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
                                    validate(
                                        option,
                                        mandatoryShift.call(
                                            this,
                                            option._action.length - 2,
                                            option._name
                                        )
                                    )
                                )
                            );
                        }
                    } else {
                        option._action.call(self, options, option._name);
                    }

                    if (option._halt)
                        break ARGS;

                } else {
                    this.error(options, 'ERROR: unrecognized option: ' + util.enquote(letter));
                }
            }

        } else {
            // TODO permit options interleaved with arguments,
            //  with associated actions, for any of positional
            //  args, variadic args, and accumulated args
            args.unshift(arg);
            break;
        }

    }

    if (util.len(this._commands)) {
        if (args.length) {
            if (util.has(this._commands, args[0])) {
                var command = this._commands[args[0]];
                command().act(args, options);
            } else {
                this.error(options, 'ERROR: unrecognized command');
            }
        } else {
            this.error(options, 'ERROR: command required');
            this.exit(0);
        }
    }

    return options;
};

exports.Argument = function (parser) {
    this._parser = parser;
    return this;
};

exports.Argument.prototype.name = function (name) {
    this._name = name;
    return this;
};

exports.Argument.prototype.optional = function () {
    this._optional = true;
    return this;
};

exports.Option = function (parser, args) {
    var self = this;
    this._parser = parser;
    this._validate = function (value) {
        return value;
    };
    this._long = [];
    this._short = [];
    util.forEach(args, function (arg) {
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
            if (!self._name) {
                self.name(arg);
                self.displayName(arg);
            } else {
                self.name(arg);
            }
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

exports.Option.prototype.displayName = function (displayName) {
    this._displayName = displayName;
    return this;
};

exports.Option.prototype.getDisplayName = function () {
    if (this._displayName)
        return this._displayName;
    return this.getName();
};

exports.Option.prototype.getName = function () {
    if (this._name)
        return this._name;
    if (this._long.length);
        return this._long[0]
    if (this._short.length)
        return this._short[0]
    throw new Error("Programmer error: unnamed option");
};

exports.Option.prototype.action = function (action) {
    var self = this;
    if (typeof action == "string") {
        this._action = self._parser[action];
    } else {
        this._action = action;
    }
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
        options[option._name].push(option._validate.call(
            this,
            value
        ));
    });
};

exports.Option.prototype.inc = function () {
    return this.def(0).action(function (options, name) {
        options[name]++;
    });
};

exports.Option.prototype.dec = function () {
    return this.def(0).action(function (options, name) {
        options[name]--;
    });
};

exports.Option.prototype.choices = function (choices) {
    this.set();
    this._choices = choices;
    var self = this;
    if (util.isArrayLike(choices)) {
        return this.validate(function (value) {
            if (choices.indexOf(value) < 0)
                throw new Error(
                    "choice for " + util.upper(self.getDisplayName()) +
                    " is invalid: " + util.enquote(value) + "\n" +
                    "Use one of: " + choices.map(function (choice) {
                        return util.enquote(choice);
                    }).join(', ')
                );
            return value;
        })
    } else {
        return this.validate(function (value) {
            if (!util.has(choices, value))
                throw new Error(
                    "choice for " + util.upper(self.getDisplayName()) +
                    " is invalid: " + util.enquote(value) + "\n" +
                    "Use one of: " + util.keys(choices).map(function (choice) {
                        return util.enquote(choice);
                    }).join(', ')
                );
            return choices[value];
        });
    }
};

exports.Option.prototype.def = function (value) {
    if (this._def === undefined)
        this._def = value;
    return this;
};

exports.Option.prototype.validate = function (validate) {
    if (this._validate) {
        validate = (function (previous) {
            return function () {
                return validate.call(this,
                    previous.apply(this, arguments)
                );
            };
        })(validate);
    }
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
    return this.set().validate(function (value) {
        var result = +value;
        if (result == NaN)
            throw new Error("not a number");
        return result;
    });
};

exports.Option.prototype.oct = function () {
    return this.set().validate(function (value) {
        var result = parseInt(value, 8);
        if (result == 0 && +value !== 0)
            throw new Error("not an octal value");
        return result;
    });
};

exports.Option.prototype.hex = function () {
    return this.set().validate(function (value) {
        var result = parseInt(value, 16);
        if (result == 0 && +value !== 0)
            throw new Error("not an hex value");
        return result;
    });
};

exports.Option.prototype.integer = function () {
    return this.set().validate(function (value) {
        var result = value >>> 0;
        if (result !== value)
            throw new Error("not an integer");
        return result;
    });
};

exports.Option.prototype.natural = function () {
    return this.set().validate(function (value) {
        var result = value >>> 0;
        if (result !== +value || result < 0)
            throw new Error("not a natural number");
        return result;
    });
};

exports.Option.prototype.whole = function () {
    return this.set().validate(function (value) {
        var result = value >>> 0;
        if (result !== +value || result < 1)
            throw new Error("not a whole number");
        return result;
    });
};

exports.Option.prototype.bool = function (def) {
    if (def === undefined)
        def = true;
    return this.def(!def).set(!!def);
};

exports.Option.prototype.todo = function (command, value) {
    this._parser.def('todo', []);
    command = command || this.getName();
    if (value)
        return this.action(function (options, name, value) {
            options.todo.push([command, value]);
        });
    else
        return this.action(function (options, name) {
            options.todo.push([command]);
        });
};

exports.Option.prototype.inverse = function () {
    var args = arguments;
    if (!args.length) {
        args = [];
        this._short.forEach(function (_) {
            args.push('-' + _.toUpperCase());
        });
        this._long.forEach(function (__) {
            args.push('--no-' + __);
        });
        if (this._name) 
            args.push(this._name);
    }
    var parser = this._parser;
    var inverse = this._inverse = parser.option.apply(
        parser,
        args
    ).set(!this._def).help('^ inverse');
    return this;
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

exports.Parser.prototype.end = function () {
    return this._parser;
};

exports.Group = function (parser, parent, name) {
    this._name = name;
    this._parser = parser;
    this._parent = parent;
    this._options = [];
    return this;
};

exports.Group.prototype.option = function () {
    var option = this._parser.option.apply(this._parser, arguments);
    option._group = this;
    this._options.push(option);
    return option;
};

exports.Group.prototype.group = function (name) {
    var Group = this.Group || this._parser.Group;
    var group = new Group(this._parser, this, name);
    return group;
};

exports.Group.prototype.end = function () {
    return this._parent;
};

exports.Parser.prototype.Parser = exports.Parser;
exports.Parser.prototype.Option = exports.Option;
exports.Parser.prototype.Group = exports.Group;

