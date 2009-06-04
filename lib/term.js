
var util = require('util');

var terms = [
    'ansi',
    'vt100',
    'xtermc',
    'xterm-color',
    'gnome-terminal'
];

exports.Stream = function (system) {
    var self = Object.create(system.stdout);
    var output = system.stdout;
    var errput = system.stderr;
    var env = system.env || {};
    var color = "";
    var bold = "0";
    var stack = [];
    var enabled = util.has(terms, env.TERM);

    self.print = function () {
        // todo recordSeparator, fieldSeparator
        self.write(Array.prototype.join.call(arguments, " ") + "\n");
        self.flush();
        return self;
    };

    self.write = function (string) {
        var at = 0;
        self.update(bold, color);
        while (at < string.length) {
            var pos = string.indexOf("\0", at);
            if (pos == -1) {
                // no additional marks, advanced to end
                output.write(string.substring(at, string.length));
                at = string.length;
            } else {
                output.write(string.substring(at, pos));
                at = pos + 1;
                if (string.charAt(at) == ")") {
                    if (!stack.length)
                        throw new Error("No colors on the stack at " + at);
                    var pair = stack.pop();
                    bold = pair[0];
                    color = pair[1];
                    at = at + 1;
                    self.update(bold, color);
                } else {
                    var paren = string.indexOf("(", at);
                    stack.push([bold, color]);
                    var colorName = string.substring(at, paren);
                    if (colorName == "bold") {
                        bold = "1";
                    } else if (!Object.prototype.hasOwnProperty.call(exports.colors, colorName)) {
                        throw new Error("No such color: " + colorName);
                    } else {
                        color = exports.colors[colorName];
                    }
                    self.update(bold, color);
                    at = paren + 1;
                }
            }
        }
        self.update("0", "");
    };

    self.moveTo = function (y, x) {
        errput.write("\033[" + y + ";" + x + "H").flush();
    };

    self.moveBy = function (y, x) {
        if (y == 0) {
        } else if (y < 0) {
            errput.write("\033[" + (-y) + "A");
        } else {
            errput.write("\033[" + y + "B");
        }
        if (x == 0) {
        } else if (x > 0) {
            errput.write("\033[" + x + "C");
        } else {
            errput.write("\033[" + (-x) + "D");
        }
        errput.flush();
    };

    self.home = function () {
        errput.write("\033[H").flush();
        return self;
    };

    self.clear = function () {
        errput.write("\033[2J").flush();
        return self;
    };
    self.clearUp = function () {
        errput.write("\033[1J").flush();
        return self;
    };
    self.cearDown = function () {
        errput.write("\033[J").flush();
        return self;
    };
    self.clearLine = function () {
        errput.write("\033[2K").flush();
        return self;
    };
    self.clearLeft = function () {
        errput.write("\033[1K").flush();
        return self;
    };
    self.clearRight = function () {
        errput.write("\033[K").flush();
        return self;
    };

    self.update = function (bold, color) {
        if (enabled) {
            output.flush();
            errput.flush().write(
                "\033[" + bold + ";" +
                (color.length ? "3" + color : "") + "m"
            );
            output.flush();
        }
        return self;
    };
    
    self.update(bold, color);

    return self;
};

exports.colors = {
    "black": "0",
    "red": "1",
    "green": "2",
    "orange": "3",
    "yellow": "3",
    "blue": "4",
    "violet": "5",
    "magenta": "5",
    "purple": "5",
    "cyan": "6",
    "white": "7"
}

exports.stream = new exports.Stream(system);

if (require.id == require.main) {
    exports.stream.print("white\0red(red\0blue(blue\0)red\0)white");
    Object.keys(exports.colors).forEach(function (name) {
        exports.stream.print("\0" + name + "(" + name + "\0)");
        exports.stream.print("\0bold(\0" + name + "(" + name + "\0)\0)");
    });
}

