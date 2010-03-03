
// -- gmosx George Moschovitis

/**
 * Escape significant HTML characters as HTML entities.
 */
exports.escape = exports.escapeHTML = function(string) {
    return String(string)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};

/**
 * Translate basic HTML entities for ampersand, less-than,
 * and greater-than to their respective plain characters.
 */
exports.unescape = function(string) {
    return String(string)
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
};

/**
 * Strip HTML tags.
 */
exports.stripTags = function (str) {
    return str.replace(/<([^>]+)>/g, "");
}

// deprecated

exports.escapeHTML = function (str) {
    require("narwhal").deprecation("html.escapeHTML is deprecated.");
    return exports.escape(str);
};

