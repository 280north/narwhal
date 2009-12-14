
var binary = require("./binary");

var JString = Packages.java.lang.String,
    JInteger = Packages.java.lang.Integer,
    JStringBuffer = Packages.java.lang.StringBuffer,
    JMessageDigest = Packages.java.security.MessageDigest;

exports.hash = function (str) {
    var jstr = new JString(str);
    var algorithm = JMessageDigest.getInstance("MD5");
    algorithm.reset();
    algorithm.update(jstr.getBytes());
    var bytes = algorithm.digest();
    return binary.ByteString(bytes);
};

// deprecated
// 

var MD5 = exports.MD5 = {};

MD5.hexdigest = function(str) {
    system.log.warn('hexdigest is depreacted, use md5.hash().toString(16)');
    var jstr = new JString(str);
    var algorithm = JMessageDigest.getInstance("MD5");
    
    algorithm.reset();
    algorithm.update(jstr.getBytes());

    var messageDigest = algorithm.digest();
    
    var hexString = new JStringBuffer();
    for (var i = 0; i < messageDigest.length; i++) {
        hexString.append(JInteger.toHexString(0xFF & messageDigest[i]));
    }

    return String(hexString.toString());
};

