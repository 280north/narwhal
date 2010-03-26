
/**
 * Prints a deprecation warning to standard output, with
 * terminal colors if possible.
 * @param {String} warning
 */
exports.deprecated = function(warning) {
    require("narwhal/term")
        .stream
        .printError("\0yellow(Deprecated: "+warning+"\0)");
}

