// String additions

String.prototype.forEach = function(block, separator) {
    system.print("WARNING: String.prototype.forEach deprecated");
    block(String(this)); // RHINO bug: it thinks "this" is a Java string (?!)
};

String.prototype.squeeze = function() {
    var set = arguments.length > 0 ? "["+Array.prototype.join.apply(arguments, ["]|["])+"]" : ".|\\n",
        regex = new RegExp("("+set+")\\1+", "g");
    
    return this.replace(regex, "$1");
};

String.prototype.chomp = function(separator) {
    var extra = separator ? separator + "|" : "";
    return this.replace(new RegExp("("+extra+"\\r|\\n|\\r\\n)*$"), "");
};

// Check if the string starts with the given prefix string.
String.prototype.begins = function(str) {
    return this.indexOf(str) === 0;
};

// Check if the string ends with the given postfix string.
String.prototype.ends = function(str) {
    var offset = this.length - str.length;
    return offset >= 0 && this.lastIndexOf(str) === offset;
};

// Trim the string, left/right.
//
// Faster version: http://blog.stevenlevithan.com/archives/faster-trim-javascript
//
// function trim (str) {
// var str = str.replace(/^\s\s*/, ''),
// ws = /\s/,
// i = str.length;
// while (ws.test(str.charAt(--i)));
// return str.slice(0, i + 1);
// }
//Trim the string, left.
var trimBeginExpression = /^\s\s*/g;
String.prototype.trimBegin = function() {
	return this.replace(trimBeginExpression, "");
};

// Trim the string, right.
var trimEndExpression = /\s\s*$/g;
String.prototype.trimEnd = function() {
	return this.replace(trimEndExpression, "");
};

String.prototype.trim = function() {
	return this.replace(trimBeginExpression, "").replace(trimEndExpression, "");
};

/* binary */

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

