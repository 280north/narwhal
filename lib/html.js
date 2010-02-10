
// gmosx, George Moschovitis

/**
 * Escape HTML characters.
 * TODO: Deprecate escapeHTML() in favor of escape()
 */
exports.escape = exports.escapeHTML = function(str) {
    if (str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } else {
        return "";
    }        
}
 
/**
 * Unescape HTML characters.
 */
exports.unescape = function(str) {
    if (str) {
        return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    } else {
        return "";
    }        
}
 
/**
 * Strip HTML tags.
 */
exports.stripTags = function (str) {
	return str.replace(/<([^>]+)>/g, "");
}
