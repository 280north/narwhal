
// -- gmosx George Moschovitis Copyright (C) 2009-2010 MIT License

/**
 * Escape significant HTML characters as HTML entities.
 */
exports.escape = function(string) {
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
    require("narwhal/deprecated").deprecated("html.escapeHTML is deprecated.");
    return exports.escape(str);
};

