require("../jack");

Jack.Request = function(env) {
    if (env["jack.request"])
        return env["jack.request"];
        
    this.env = env;
    this.env["jack.request"] = this;
}

Jack.Request.prototype.body            = function() { return this.env["jack.input"];                };
Jack.Request.prototype.scheme          = function() { return this.env["jack.url_scheme"];           };
Jack.Request.prototype.scriptName      = function() { return this.env["SCRIPT_NAME"].toString();    };
Jack.Request.prototype.pathInfo        = function() { return this.env["PATH_INFO"].toString();      };
Jack.Request.prototype.port            = function() { return parseInt(this.env["SERVER_PORT"], 10); };
Jack.Request.prototype.requestMethod   = function() { return this.env["REQUEST_METHOD"];            };
Jack.Request.prototype.queryString     = function() { return this.env["QUERY_STRING"].toString();   };
Jack.Request.prototype.contentLength   = function() { return this.env['CONTENT_LENGTH'];            };
Jack.Request.prototype.contentType     = function() { return this.env['CONTENT_TYPE'];              };

Jack.Request.prototype.isGet           = function() { return this.requestMethod() === "GET";        };
Jack.Request.prototype.isPost          = function() { return this.requestMethod() === "POST";       };
Jack.Request.prototype.isPut           = function() { return this.requestMethod() === "PUT";        };
Jack.Request.prototype.isDelete        = function() { return this.requestMethod() === "DELETE";     };
Jack.Request.prototype.isHead          = function() { return this.requestMethod() === "HEAD";       };

Jack.Request.prototype.GET = function() {
    // cache the parsed query:
    if (this.env["jack.request.query_string"] !== this.queryString()) {
        this.env["jack.request.query_string"] = this.queryString();
        this.env["jack.request.query_hash"] = Jack.Utils.parseQuery(this.queryString());
    }
    if (arguments.length > 0)
        return this.env["jack.request.query_hash"][arguments[0]];
    else
        return this.env["jack.request.query_hash"];
}

Jack.Request.prototype.params = function() {
    return this.GET.apply(this, arguments);
}
