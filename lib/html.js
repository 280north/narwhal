/**
 * Escape HTML characters.
 */
exports.escapeHTML = function(str) {
    if (str)
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");   
    else    
        return "";
}
 
/**
 * Strip HTML tags.
 */
exports.stripTags = function (str) {
	return str.replace(/<([^>]+)>/g, "");
}