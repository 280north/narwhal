var Utils = require("utils");

var Request = exports.Request = function(env) {
    this.env = env;
    this.env["jack.request"] = this;
}

Request.prototype.body            = function() { return this.env["jack.input"];                };
Request.prototype.scheme          = function() { return this.env["jack.url_scheme"];           };
Request.prototype.script_name     = function() { return this.env["SCRIPT_NAME"].toString();    };
Request.prototype.path_info       = function() { return this.env["PATH_INFO"].toString();      };
Request.prototype.port            = function() { return parseInt(this.env["SERVER_PORT"], 10); };
Request.prototype.request_method  = function() { return this.env["REQUEST_METHOD"];            };
Request.prototype.query_string    = function() { return this.env["QUERY_STRING"].toString();   };
Request.prototype.content_length  = function() { return this.env['CONTENT_LENGTH'];            };
Request.prototype.content_type    = function() { return this.env['CONTENT_TYPE'];              };

Request.prototype.GET = function() {
    // cache the parsed query:
    if (this.env["jack.request.query_string"] !== this.query_string()) {
        this.env["jack.request.query_string"] = this.query_string();
        this.env["jack.request.query_hash"] = Utils.parse_query(this.query_string());
    }
    if (arguments.length > 0)
        return this.env["jack.request.query_hash"][arguments[0]];
    else
        return this.env["jack.request.query_hash"];
}
