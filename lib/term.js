
exports.TermStream = function (output, errput) {
    var self = Object.create(output);
    var color = "37";
    var bold = "0";
    var stack = [];

    self.print = function () {
        // todo recordSeparator, fieldSeparator
        self.write(Array.prototype.join.call(arguments, " ") + "\n");
        self.flush();
        return self;
    };

    self.write = function (string) {
        var at = 0;
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
                    self.code();
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
                    self.code();
                    at = paren + 1;
                }
            }
        }
    };

    self.code = function () {
        errput.flush();
        output.flush();
        output.write("\033[" + bold + ";" + color + "m");
        output.flush();
    };
    
    self.code();

    return self;
};

exports.colors = {
    "red": "31",
    "green": "32",
    "orange": "33",
    "yellow": "33",
    "blue": "34",
    "violet": "35",
    "magenta": "35",
    "purple": "35",
    "cyan": "36",
    "white": "37"
}

if (require.id == require.main) {
    var ts = exports.TermStream(system.stdout, system.stderr);
    ts.print("white\0red(red\0blue(blue\0)red\0)white");
    Object.keys(exports.colors).forEach(function (name) {
        ts.print("\0" + name + "(" + name + "\0)");
        ts.print("\0bold(\0" + name + "(" + name + "\0)\0)");
    });
}

