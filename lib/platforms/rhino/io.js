// IO: Rhino

var IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
}

IO.prototype.read = function(length, encoding) {
    var result = "",
        readAll = false;
        
    if (length === undefined) {
        readAll = true;
        length = 1024;
    }
    
    if (!this.buffer || length > this.buffer.length)
        this.buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, length);
        
    var bytes;
    do {
        bytes = this.inputStream.read(this.buffer, 0, length)
    
        if (bytes !== length && !readAll)
            log.debug("not enough to read (requested="+length+", actual="+bytes+")");
        
        if (bytes > 0)
            result += new java.lang.String(this.buffer, 0, bytes, encoding || "US-ASCII"); // FIXME: eek?!
        
    } while (readAll && bytes > 0);
    
    return result;
}

IO.prototype.write = function(object, encoding) {
    var bytes = new Packages.java.lang.String(object).getBytes(encoding || "US-ASCII"); // FIXME: eek?!
    this.outputStream.write(bytes);
}

IO.prototype.flush = function() {
    this.outputStream.flush();
}

IO.prototype.close = function() {
    if (this.inputStream)
        this.inputStream.close();
    if (this.outputStream)
        this.outputStream.close();
}
