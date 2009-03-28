var Utils = require("./utils");

var Request = exports.Request = function(env) {
    if (env["jack.request"])
        return env["jack.request"];
        
    this.env = env;
    this.env["jack.request"] = this;
}

Request.prototype.body            = function() { return this.env["jack.input"];                };
Request.prototype.scheme          = function() { return this.env["jack.url_scheme"];           };
Request.prototype.scriptName      = function() { return this.env["SCRIPT_NAME"];               };
Request.prototype.pathInfo        = function() { return this.env["PATH_INFO"];                 };
Request.prototype.port            = function() { return parseInt(this.env["SERVER_PORT"], 10); };
Request.prototype.requestMethod   = function() { return this.env["REQUEST_METHOD"];            };
Request.prototype.queryString     = function() { return this.env["QUERY_STRING"];              };
Request.prototype.referer         = function() { return this.env["HTTP_REFERER"];              };
Request.prototype.referrer        = Request.prototype.referer;
Request.prototype.contentLength   = function() { return this.env["CONTENT_LENGTH"];            };
Request.prototype.contentType     = function() { return this.env["CONTENT_TYPE"];              };

Request.prototype.host = function() {
    // Remove port number.
    return (this.env["HTTP_HOST"] || this.env["SERVER_NAME"]).replace(/:\d+\z/g, "");
}
    
Request.prototype.isGet           = function() { return this.requestMethod() === "GET";        };
Request.prototype.isPost          = function() { return this.requestMethod() === "POST";       };
Request.prototype.isPut           = function() { return this.requestMethod() === "PUT";        };
Request.prototype.isDelete        = function() { return this.requestMethod() === "DELETE";     };
Request.prototype.isHead          = function() { return this.requestMethod() === "HEAD";       };

Request.prototype.GET = function() {
    // cache the parsed query:
    if (this.env["jack.request.query_string"] !== this.queryString()) {
        this.env["jack.request.query_string"] = this.queryString();
        this.env["jack.request.query_hash"] = Utils.parseQuery(this.queryString());
    }
    if (arguments.length > 0)
        return this.env["jack.request.query_hash"][arguments[0]];
    else
        return this.env["jack.request.query_hash"];
}

Request.prototype.POST = function() {
    if (this.env["jack.request.form_input"] === this.env["jack.input"])
        return this.env["jack.request.form_hash"];
    
    if (true || this.hasFormData()) {
        this.env["jack.request.form_input"] = this.env["jack.input"];
        this.env["jack.request.form_hash"] = Utils.parseMultipart(this.env);
        if (!this.env["jack.request.form_hash"]) {
            this.env["jack.request.form_vars"] = this.env["jack.input"].read();
            log.debug(this.env["jack.request.form_vars"]);
            this.env["jack.request.form_hash"] = Utils.parseQuery(this.env["jack.request.form_vars"]);
            //this.env["jack.input"].rewind();
        }
        return this.env["jack.request.form_hash"];
    }
    
    return {};
}

Request.prototype.params = function() {
    var get = this.GET(),
        post = this.POST(),
        params = {};
    for (var i in get)
        params[i] = decodeURIComponent(get[i].replace(/\+/g, " "));
    for (var i in post)
        params[i] = decodeURIComponent(post[i].replace(/\+/g, " "));
    return params;
}

Request.prototype.cookies = function() {
    var hash;
    
    if (!this.env["HTTP_COOKIE"]) return {};

    if (this.env["jack.request.cookie_string"] != this.env["HTTP_COOKIE"])  {
        this.env["jack.request.cookie_string"] = this.env["HTTP_COOKIE"]
        // According to RFC 2109:
        // If multiple cookies satisfy the criteria above, they are ordered in
        // the Cookie header such that those with more specific Path attributes
        // precede those with less specific. Ordering with respect to other
        // attributes (e.g., Domain) is unspecified.
        var parts = this.env["HTTP_COOKIE"].split(";");

        hash = this.env["jack.request.cookie_hash"] = {};
        
        for (var i in parts) {
            var data = parts[i].split("=");
            // gmosx: leave it as is (or better copy Rack's implementation!)
            hash[decodeURIComponent(data[0])] = decodeURIComponent(data[1]);
        }
    }    

    return this.env["jack.request.cookie_hash"];
}

Request.prototype.relativeURI = function() {
    var qs = this.queryString();
    
    if (qs) {
        return this.pathInfo() + "?" + qs;
    } else {
        return this.pathInfo();
    }
}

Request.prototype.uri = function() {
    var uri = this.scheme() + "://" + this.host();
     
    if ((this.scheme() == "https" && port != 443) || (scheme == "http" && port != 80)) {
        url = uri + port();
    }

    return uri + relativeURI(); 
}
