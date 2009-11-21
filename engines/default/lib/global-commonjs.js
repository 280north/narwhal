
// https://wiki.mozilla.org/ServerJS/Binary/B
if (!String.prototype.toByteString)
    String.prototype.toByteString = function(charset) {
        // RHINO bug: it thinks "this" is a Java string (?!)
        var binary = require("binary");
        return new binary.ByteString(String(this), charset);
    };

// https://wiki.mozilla.org/ServerJS/Binary/B
if (!String.prototype.toByteArray)
    String.prototype.toByteArray = function(charset) {
        // RHINO bug: it thinks "this" is a Java string (?!)
        var binary = require("binary");
        return new binary.ByteArray(String(this), charset);
    };

// https://wiki.mozilla.org/ServerJS/Binary/B
if (!String.prototype.charCodes)
    String.prototype.charCodes = function() {
        return Array.prototype.map.call(this, function (c) {
            return c.charCodeAt();
        });
    };

// https://wiki.mozilla.org/ServerJS/Binary/B
if (!String.prototype.fromCharCodes)
    String.fromCharCodes = function (codes) {
        return codes.map(String.fromCharCode).join('');
    };

// https://wiki.mozilla.org/ServerJS/Binary/B
if (!Array.prototype.toByteString)
    Array.prototype.toByteString = function(charset) {
        return new require("binary").ByteString(this);
    };

if (!Array.prototype.toByteArray)
    Array.prototype.toByteArray = function(charset) {
        return new ByteArray(this);
    };

