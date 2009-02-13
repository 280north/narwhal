// String additions

String.prototype.forEach = function(block, separator) {
    block(String(this)); // RHINO bug: it thinks "this" is a Java string (?!)
    
    //if (!separator)
    //    separator = /\n+/;
    //
    //this.split(separator).forEach(block);
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
