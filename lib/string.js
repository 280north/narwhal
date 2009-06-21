// String additions

String.prototype.forEach = function(block, separator) {
    system.print("WARNING: String.prototype.forEach deprecated");
    block(String(this)); // RHINO bug: it thinks "this" is a Java string (?!)
}

String.prototype.squeeze = function() {
    var set = arguments.length > 0 ? "["+Array.prototype.join.apply(arguments, ["]|["])+"]" : ".|\\n",
        regex = new RegExp("("+set+")\\1+", "g");
    
    return this.replace(regex, "$1");
}

String.prototype.chomp = function(separator) {
    var extra = separator ? separator + "|" : "";
    return this.replace(new RegExp("("+extra+"\\r|\\n|\\r\\n)*$"), "");
}

// Check if the string starts with the given prefix string.
String.prototype.startsWith = function(str) {
    return this.indexOf(str) === 0;
}

// Check if the string ends with the given postfix string.
String.prototype.endsWith = function(str) {
    var offset = this.length - str.length;
    return offset >= 0 && this.lastIndexOf(str) === offset;
}

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
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, "");
}

//Trim the string, left.
String.prototype.ltrim = function() {
	return this.replace(/^\s+/g, "");
}

// Trim the string, right.
String.prototype.rtrim = function() {
	return this.replace(/\s+$/g, "");
}

