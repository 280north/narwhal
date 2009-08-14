// original code: http://code.google.com/p/js-uri/

// Based on the regex in RFC2396 Appendix B.
var URI_RE = /^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/;

/**
 * Uniform Resource Identifier (URI) - RFC3986
 */
var URI = exports.URI = function(str) {
    if (!str) str = "";
    var result = str.match(URI_RE);
    this.scheme = result[1] || null;
    this.authority = result[2] || null;
    this.path = result[3] || null;
    this.query = result[4] || null;
    this.fragment = result[5] || null;
}

/**
 * Convert the URI to a String.
 */
URI.prototype.toString = function () {
    var str = "";
 
    if (this.scheme)
        str += this.scheme + ":";

    if (this.authority)
        str += "//" + this.authority;

    if (this.path)
        str += this.path;

    if (this.query)
        str += "?" + this.query;

    if (this.fragment)
        str += "#" + this.fragment;
 
    return str;
}

URI.parse = function(uri) {
    return new URI(uri);
}

URI.unescape = function(str, plus) {
    return decodeURI(str).replace(/\+/g, " ");
}

URI.unescapeComponent = function(str, plus) {
    return decodeURIComponent(str).replace(/\+/g, " ");
}


