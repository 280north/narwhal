
exports.Stream = function (output, errput) {
    var self = Object.create(output);
    var color = "7";
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
        self.code(bold, color);
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
                    self.code(bold, color);
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
                    self.code(bold, color);
                    at = paren + 1;
                }
            }
        }
        self.code("0", "7");
    };

    self.code = function (bold, color) {
        errput.flush();
        output.flush();
        errput.write("\033[" + bold + ";3" + color + "m");
        output.flush();
    };
    
    self.code(bold, color);

    return self;
};

exports.colors = {
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

exports.stream = new exports.Stream(system.stdout, system.stderr);

if (require.id == require.main) {
    exports.stream.print("white\0red(red\0blue(blue\0)red\0)white");
    Object.keys(exports.colors).forEach(function (name) {
        exports.stream.print("\0" + name + "(" + name + "\0)");
        exports.stream.print("\0bold(\0" + name + "(" + name + "\0)\0)");
    });
}

