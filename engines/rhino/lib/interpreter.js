
// tlrobinson Tom Robinson
// -- kriskowal Kris Kowal Copyright 2009-2010 MIT License

// Prototyping and expermenting with Context Creation and Module
// evaluation, per ECMAScript strawman proposal:
// http://wiki.ecmascript.org/doku.php?id=strawman:modules_primordials

var Context = exports.Context = function() {
    var self = this;

    var context = new Packages.org.mozilla.javascript.Context();
    self.global = context.initStandardObjects();

    self.eval = function(source) {
        source = source || "";
        var sourceURL = findSourceURL(source) || "<eval>";

        return context.evaluateString(
            self.global,
            source,
            sourceURL,
            1,
            null
        );
    };

    self.importScript = function (sourceURL) {
        return context.evaluateReader(
            self.global,
            new Packages.java.io.FileReader(sourceURL),
            sourceURL,
            1,
            null
        );
    };

    self.importScripts = function () {
        for (var i = 0, ii = arguments.length; i < ii; i++) {
            self.importScript(arguments[i]);
        }
    };

    self.Module = function (text, fileName, lineNo) {
        return function (inject) {
            var names = [];
            for (var name in inject)
                if (Object.prototype.hasOwnProperty.call(inject, name))
                    names.push(name);
            return context.compileFunction(
                self.global,
                "function(" + names.join(",") + "){" + text + "\n}",
                String(fileName),
                Number(lineNo) || 1,
                null
            ).apply(null, names.map(function (name) {
                return inject[name];
            }));
        };
    };

    self.Function = function() {
        var args = Array.prototype.slice.call(arguments);
        var body = args.pop() || "";
        var source = "function("+args.join(",")+"){"+body+"/**/\n}";
        var sourceURL = findSourceURL(body) || "<function>";
        
        return context.compileFunction(
            self.global,
            source,
            sourceURL,
            1,
            null
        );
    };
    
    return self;
};

function findSourceURL(source) {
    // based on https://bugs.webkit.org/show_bug.cgi?id=25475#c4
    var match = source.match(/.*\s*\/\/\s*@\s*sourceURL\s*=\s*(\S+)\s*/);
    if (match)
        return match[1];
    return null;
}

