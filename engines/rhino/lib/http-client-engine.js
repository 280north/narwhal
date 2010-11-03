
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson

var IO = require("io").IO;

exports.open = function(url, mode, options) {
    var connection, output, input;

    function startRequest() {
        connection = new java.net.URL(url).openConnection();
        connection.setDoInput(true);
        connection.setDoOutput(true);
        connection.setRequestMethod(options.method);
        connection.setInstanceFollowRedirects(!!options.followRedirects);

        for (var name in options.headers) {
            if (options.headers.hasOwnProperty(name)) {
                connection.addRequestProperty(String(name), String(options.headers[name]));
            }
        }

        connection.connect();

        output = new IO(null, connection.getOutputStream());
        input = null;
    }

    startRequest();

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
                    var key = connection.getHeaderFieldKey(i), value = connection.getHeaderField(i);
                    if (!key && !value) {
                        break;
                    }
                    if (key) {
                        key = String(key);
                        value = String(value);
                        this.headers[key] = value;
                        if (key.toUpperCase() === "LOCATION")
                            url = value;
                    }
                }

                // Manually follow cross-protocol redirects because Java doesn't:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4620571
                if (options.followRedirects && this.status >= 300 && this.status < 400) {
                    // TODO: should we change the method to GET if it was not a GET like curl does?
                    startRequest();
                    return this.read.apply(this, arguments);
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
            output && output.close();
            input && input.close();
            return this;
        },
        copy : IO.prototype.copy
    }
    return request;
};
