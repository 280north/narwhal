
// -- tlrobinson Tom Robinson

var FILE = require("file");
var IO = require("io").IO;

exports.open = function(url, mode, options) {
    mode = mode || "b";
    options = options || {};

    options.method = options.method || "GET";
    options.headers = options.headers || {};

    var connection = new java.net.URL(url).openConnection();
    connection.setDoInput(true);
    connection.setDoOutput(true);
    connection.setRequestMethod(options.method);

    for (var name in options.headers){
        connection.addRequestProperty(String(name), String(options.headers[name]));
    }

    connection.connect();

    var output = new IO(null, connection.getOutputStream());
    var input = null;

    var request = {
        status : null,
        headers : {},
        read : function() {
            if (!input) {
                output.close();
                input = new IO(connection.getInputStream(), null);
                this.status = Number(connection.getResponseCode());
                this.statusText = String(connection.getResponseMessage() || "");
                for (var i = 0; ; i++) {
                    var key = connection.getHeaderFieldKey(i), value = connection.getHeaderField(i)
                    if (! key && ! value)
                        break;
                    if (key)
                        this.headers[String(key)] = String(value);
                }
            }
            return input.read.apply(input, arguments);
        },
        write : function() {
            output.write.apply(output, arguments);
            return this;
        },
        flush : function() {
            output.flush.apply(output, arguments);
            return this;
        },
        close : function() {
            if (output)
                output.close();
            if (input)
                input.close();
            return this;
        },
        copy : IO.prototype.copy
    }
    return request
};

exports.read = function(url) {
    var stream = exports.open(url);
    try {
        return stream.read();
    } finally {
        stream.close();
    }
};

exports.copy = function(source, target, mode) {
    mode = mode || "b";
    return FILE.path(target).write(exports.read(source, mode), mode);
};
