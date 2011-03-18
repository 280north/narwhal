
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson
// -- jukart Jürgen Kartnaller
// -- paulbaumgart Paul Baumgart
// -- danielphelps Daniel Phelps

var IO = require("io").IO,
    URI =  require("uri");

var http_proxy = java.lang.System.getProperty("narwhal.http_proxy");
if (http_proxy) {
    var proxySettings = URI.parse(http_proxy);
    java.lang.System.setProperty("http.proxyHost", proxySettings.domain);
    java.lang.System.setProperty("http.proxyPort", proxySettings.port);
    java.lang.System.setProperty("http.proxyUsername", proxySettings.user);
    java.lang.System.setProperty("http.proxyPassword", proxySettings.password);
}

exports.open = function(url, mode, options) {
    var connection, output, input;

    function setAuthenticator() {
        var username = java.lang.System.getProperty("http.proxyUsername");
        var password = java.lang.System.getProperty("http.proxyPassword");
        var passwordAuthentication = function() {
            return new PasswordAuthentication(username, password.toCharArray());
        };

        if (username && password) {
            java.net.Authenticator.setDefault(
                new Authenticator({
                    "getPasswordAuthentication": passwordAuthentication
                })
            );
        }
    }

    function getProxy() {
        var selector = java.net.ProxySelector.getDefault();
        var proxies = selector.select(java.net.URI(url));

        //This list is never empty -- at the very least, it contains
        //java.net.Proxy.NO_PROXY.  See java.net.ProxySelector.select()
        //and java.net.Proxy.
        return proxies.get(0);
    }

    function initConnection() {
        connection = new java.net.URL(url).openConnection(getProxy());
        connection.setDoInput(true);
        connection.setDoOutput(false);
        connection.setRequestMethod(options.method);
        connection.setInstanceFollowRedirects(!!options.followRedirects);

        for (var name in options.headers) {
            if (options.headers.hasOwnProperty(name)) {
                connection.addRequestProperty(String(name), String(options.headers[name]));
            }
        }

        output = null;
        input = null;
    }

    function startRequest(writeable) {
        connection.setDoOutput(writeable);
        connection.connect();
        if (!output && writeable) {
            output = new IO(null, connection.getOutputStream());
        }
    }

    initConnection();

    var request = {
        status : null,
        headers : {},
        read : function() {
            if (!input) {
                startRequest(false); // open a readable connection if not already open
                output && output.close();
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
                    initConnection();
                    return this.read.apply(this, arguments);
                }
            }
            return input.read.apply(input, arguments);
        },
        write : function() {
            startRequest(true); // open a writeable connection if not already open
            output.write.apply(output, arguments);
            return this;
        },
        flush : function() {
            startRequest(true); // open a writeable connection if not already open
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
