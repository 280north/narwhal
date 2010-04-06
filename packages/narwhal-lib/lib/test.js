
// -- zaach Zachary Carter
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var SYSTEM = require('system');
var FS = require('file');
var ASSERT = require("assert");
var UTIL = require('narwhal/util');
var TERM = require("narwhal/term");
var jsDump = require("test/jsdump").jsDump;

var ARGS = require('args');
var parser = exports.parser = new ARGS.Parser();
parser.option('--no-color', 'color').def(true).set(false);
parser.option('--loop', 'loop').def(false).set(true);
parser.option('--show-stack-traces', 'showStackTraces').def(false).set(true);
parser.option('--show-passes', 'showPasses').def(false).set(true);
parser.option('-q', '--quiet', 'quiet').def(false).set(true);
parser.helpful();

function getStackTrace(e) {
    if (!e) {
        return "";
    }
    else if (e.rhinoException) {
        var s = new Packages.java.io.StringWriter();
        e.rhinoException.printStackTrace(new Packages.java.io.PrintWriter(s));
        return String(s.toString());
    }
    else if (e.javaException) {
        var s = new Packages.java.io.StringWriter();
        e.javaException.printStackTrace(new Packages.java.io.PrintWriter(s));
        return String(s.toString());
    }
    else if (e.stack) {
        return String(e.stack);
    }
    return "";
}

exports.run = function(test, log) {
    var options = parser.parse([module.path].concat(SYSTEM.args));
    if (!test) {
        var fileName = options.args.shift();
        if (!fileName) {
            parser.error(options, "You must specify a file to run as a test module.");
            parser.exit(-1);
        }
        var id = FS.canonical(fileName);
        test = require(id);
    }

    if (options.color == false)
        stream.disable();
    if (!log)
        log = new exports.Log(id, options);

    do {
        var result = _run(test, log);
    } while (options.loop);

    log.report();
    
    return result;
}

var _run = function (test, log, options) {

    if (typeof test === "string")
        test = require(test);

    if (!test)
        throw "Nothing to run";

    for (var property in test) {
        if (property.match(/^test/)) {

            var section = log.section(property);
            // alternate logging assertions for those who care
            // to use them.
            var assert = section.Assert();

            if (typeof test[property] == "function") {
                if (typeof test.setup === "function")
                    test.setup();

                var globals = {};
                for (var name in SYSTEM.global) {
                    globals[name] = true;
                }

                try {
                    try {
                        if (section.begin)
                            section.begin();
                        test[property](assert);
                    } finally {
                        if (!test.addsGlobals) {
                            for (var name in SYSTEM.global) {
                                if (!globals[name]) {
                                    delete SYSTEM.global[name];
                                    throw new ASSERT.AssertionError({
                                        "message": "New global introduced: " + UTIL.enquote(name)
                                    });
                                }
                            }
                        }
                        if (section.end)
                            section.end();
                    }

                    if (!section.passes)
                        section.pass();
                } catch (e) {
                    if (e.name === "AssertionError") {
                        section.fail(e);
                    } else {    
                        section.error(e);
                    }
                } finally {
                    if (typeof test.teardown === "function")
                        test.teardown();
                }
            } else {
                _run(test[property], section, options);
            }
        }
    }
};

/*
    Log API as applied by the generic test runner:
        log.pass(message_opt)
        log.fail(assertion)
        log.error(exception)
        log.section(name) :Log
    Log API as used by the command line test runner:
        new Log(name_opt, options)
*/

exports.Log = function (name, options, stream, parent, root) {
    if (!stream)
        stream = TERM.stream;
    this.options = options;
    this.stream = new exports.Section(stream, "  ");
    this.name = name;
    this.parent = parent;
    this.root = root || this;
    this.passes = 0;
    this.fails = 0;
    this.errors = 0;

    if (!options.quiet)
        this.flush();
};

exports.Log.prototype.flush = function () {
    if (!this.flushed) {
        this.flushed = true;
        if (this.parent)
            this.parent.flush();
        this.stream.stream.print("+ Running" + (this.name ? " " + this.name : ""));
    }
}

exports.Log.prototype.pass = function (message) {
    this.passes += 1;
    this.root.passes += 1;
    if (this.options.showPasses)
        this.print("\0green(PASS" + (message ? ":\0) " + message : "\0)"));
};

exports.Log.prototype.fail = function (exception) {
    this.fails += 1;
    this.root.fails += 1;

    var stacktrace = getStackTrace(exception);
    
    this.flush(); // prints title if it hasn't been yet
    this.print("\0yellow(FAIL" + (exception.message ? ": " + exception.message + "\0)": "\0)"));
    if (exception.operator) {
        this.print("\0yellow(Expected: "+jsDump.parse(exception.expected));
        this.print("Actual: "+jsDump.parse(exception.actual));
        this.print("Operator: "+exception.operator+"\0)");
    }
    if (this.options.showStackTraces && stacktrace)
        this.print("\0blue("+stacktrace+"\0)");

};

exports.Log.prototype.error = function (exception, message) {
    this.errors += 1;
    this.root.errors += 1;

    var stacktrace = getStackTrace(exception);
    
    this.flush(); // prints title if it hasn't been yet
    this.print("\0red(ERROR: "+exception + "\0)");
    if (stacktrace)
        this.print("\0blue("+stacktrace+"\0)");
    
};

exports.Log.prototype.begin = function () {
    TERM.stream.write("\0blue(");
};

exports.Log.prototype.end = function () {
    TERM.stream.write("\0)");
};

exports.Log.prototype.report = function () {
    this.stream.stream.print([
        color("Passes: " + this.passes, "green", this.passes),
        color("Fails: " + this.fails, "yellow", this.fails),
        color("Errors: " + this.errors, "red", this.errors)
    ].join(", "));
};

var color = function (message, color, whether) {
    if (whether)
        return "\0" + color + "(" + message + "\0)";
    else
        return message;
};

exports.Log.prototype.print = function (message) {
    this.stream.print(message);
};

exports.Log.prototype.section = function (name) {
    return new exports.Log(name, this.options, this.stream, this, this.root);
};

exports.Log.prototype.Assert = function () {
    if (!this.assert)
        this.assert = new ASSERT.Assert(this);
    return this.assert;
};

/**
    Section adapters wrap any object with a print
    method such that every line is indented.
*/
exports.Section = function (stream, indent) {
    this.stream = stream;
    this.indent = indent || "    ";
};

exports.Section.prototype.print = function (message) {
    message.split(/\n/g).forEach(function (line) {
        this.stream.print(this.indent + line);
    }, this);
};

if (require.main == module)
    exports.run();

