var Context = exports.Context = function() {
    var self = this;
    
    self.global = currentContext().initStandardObjects();
    
    self.eval = function(source) {
        source = source || "";
        var sourceURL = findSourceURL(source) || "<eval>";
    
        return currentContext().evaluateString(
            self.global,
            source,
            sourceURL,
            1,
            null
        );
    };
    self.evalFile = function(sourceURL) {
        return currentContext().evaluateReader(
            self.global,
            new Packages.java.io.FileReader(sourceURL),
            sourceURL,
            1,
            null
        );
    };
    self.Function = function() {
        var args = Array.prototype.slice.call(arguments);
        var body = args.pop() || "";
        var source = "function("+args.join(",")+"){"+body+"/**/\n}";
        var sourceURL = findSourceURL(body) || "<function>";
        
        return currentContext().compileFunction(
            self.global,
            source,
            sourceURL,
            1,
            null
        );
    };
    
    return self;
};

function currentContext() {
    return Packages.org.mozilla.javascript.Context.getCurrentContext();
};

function findSourceURL(source) {
    // based on https://bugs.webkit.org/show_bug.cgi?id=25475#c4
    var match = source.match(/.*\s*\/\/\s*@\s*sourceURL\s*=\s*(\S+)\s*/);
    if (match)
        return match[1];
    return null;
}