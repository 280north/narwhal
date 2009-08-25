exports.B_LENGTH = function(bytes) {
    return bytes.length;
}

exports.B_ALLOC = function(length) {
    return Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.Byte.TYPE, length);
}

exports.B_FILL = function(bytes, length, offset, value) {
    Packages.java.util.Arrays.fill(bytes, length, offset, value);
}

exports.B_COPY = function(src, srcOffset, dst, dstOffset, length) {
    Packages.java.lang.System.arraycopy(src, srcOffset, dst, dstOffset, length);
}

exports.B_GET = function(bytes, index) {
    var b = bytes[index];
    return (b >= 0) ? b : -1 * ((b ^ 0xFF) + 1);
}   

exports.B_SET = function(bytes, index, value) {
    return bytes[index] = (value < 128) ? value : -1 * ((value ^ 0xFF) + 1);
}

exports.B_DECODE = function(bytes, offset, length, codec) {
    return String(new Packages.java.lang.String(bytes, offset, length, codec));
}

exports.B_DECODE_DEFAULT = function(bytes, offset, length) {
    return String(new Packages.java.lang.String(bytes, offset, length));
}

exports.B_ENCODE = function(string, codec) {
    return new Packages.java.lang.String(string).getBytes(codec);
}

exports.B_ENCODE_DEFAULT = function(string) {
    return new Packages.java.lang.String(string).getBytes();
}

exports.B_TRANSCODE = function(bytes, offset, length, sourceCodec, targetCodec) {
    return new Packages.java.lang.String(bytes, offset, length, sourceCodec).getBytes(targetCodec);
}

function wrapper(that) {
    var obj = new JavaAdapter(
        Packages.org.mozilla.javascript.ScriptableObject,
        Packages.org.mozilla.javascript.Wrapper,
        {
            get : function(index, start) {
                if (typeof index === "number")
                    return that.get(index);
            
                return that[index];
            },
            has : function(index, start) {
                if (typeof index === "number")
                    return index < that._length;
            
                return (that[index] !== undefined)
            },
            put : function(index, start, value) {
                if (typeof index === "number")
                    that.set(index, value);
                else
                    that[index] = value;
            },
            unwrap : function() {
                var bytes = Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.Byte.TYPE, that._length);
                Packages.java.lang.System.arraycopy(that._bytes, that._offset, bytes, 0, that._length);
                return bytes;
            }
        }
    );

    obj.__proto__ = that;
    
    return obj;
}

// FIXME: disabling these because it broke several tests. figure out why.
//exports.ByteStringWrapper = wrapper;
//exports.ByteArrayWrapper = wrapper;
