// IO: Rhino

var Binary = require("./binary").Binary;

var IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
}

IO.prototype.read = function(length, encoding) {
    var readAll = false,
        buffers = [],
        buffer  = null,
        total   = 0,
        index   = 0,
        read    = 0;
    
    if (typeof length !== "number") {
        readAll = true;
        length = 1024;
    }
        
    do {
        if (!buffer)
            buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, length);
        
        read = this.inputStream.read(buffer, index, buffer.length - index);
        
        if (read < 0)
            break;
        
        index += read;
        total += read;
        
        if (index >= buffer.length) {
            buffers.push(buffer);
            buffer = null;
            index = 0;
            length *= 2;
        }
        
        //print("read="+read+" index="+index+" total="+total+" length="+length+" buffers.length="+buffers.length);
        
    } while (readAll && read > 0);
    
    var resultBuffer, resultLength;
    
    if (buffers.length === 1 && index === 0) {
        resultBuffer = buffers[0]
        resultLength = resultBuffer.length;
    }
    else {
        resultBuffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, total),
        resultLength = 0;
            
        for (var i = 0; i < buffers.length; i++) {
            var buf = buffers[i];
            java.lang.System.arraycopy(buf, 0, resultBuffer, resultLength, buf.length);
            resultLength += buf.length;
        }
        
        if (index > 0) {
            java.lang.System.arraycopy(buffer, 0, resultBuffer, resultLength, index);
            resultLength += index;
        }
    }
    
    if (total != resultLength || total !== resultBuffer.length)
        throw new Error("IO.read sanity check failed: total="+total+" resultLength="+resultLength+" resultBuffer.length="+resultBuffer.length);
        
    return new Binary(resultBuffer);
}

IO.prototype.write = function(object, encoding) {
    if (object === null || object === undefined || typeof object.toBinary !== "function")
        throw new Error("Argument to IO.write must have toBinary() method");
    
    var binary = object.toBinary(encoding);
    this.outputStream.write(binary.bytes);
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
