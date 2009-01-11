require("../jack");

Jack.Lint = function(app) {
    this.app = app;
}

Jack.Lint.prototype.invoke = function(env) {
    if (!env)
        throw new Error("No env given");
    
    this.check_env(env);
    
    var result = this.app.invoke(env),
        status = result[0], headers = result[1];
    this.body = result[2];

    this.check_status(status);
    this.check_headers(headers);
    this.check_content_type(status, headers);
    this.check_content_length(status, headers, env);
    
    return [status, headers, this];
}

Jack.Lint.prototype.each = function(block) {
    this.body.each(function(part) {
        if (typeof part !== "string")
            throw new Error("Body yielded non-string value " + part);
        block(part);
    });
}
Jack.Lint.prototype.close = function() {
    if (this.body.close)
        return this.body.close();
}

Jack.Lint.prototype.check_env = function(env) {
    if (env && typeof env !== "object" || env.constructor !== Object)
        throw new Error("env is not a hash");
    
    ["REQUEST_METHOD","SERVER_NAME","SERVER_PORT","QUERY_STRING","jack.version","jack.input","jack.errors","jack.multithread","jack.multiprocess","jack.run_once"].each(function(key) {
        if (env[key] === undefined)
        throw new Error("env missing required key " + key);
    });
    
    // The environment must not contain the keys
    // <tt>HTTP_CONTENT_TYPE</tt> or <tt>HTTP_CONTENT_LENGTH</tt>
    // (use the versions without <tt>HTTP_</tt>).
    ["HTTP_CONTENT_TYPE","HTTP_CONTENT_LENGTH"].each(function(key) {
        if (env[key] !== undefined)
        throw new Error("env contains " + key + ", must use " + key.substring(5));
    });
    
    // The CGI keys (named without a period) must have String values.
    for (var key in env)
        if (key.indexOf(".") == -1)
            if (typeof env[key] !== "string")
                throw new Error("env variable " + key + " has non-string value " + env[key]);
    
    // * <tt>jack.version</tt> must be an array of Integers.
    if (typeof env["jack.version"] !== "object" && !isArray(env["jack.version"]))
        throw new Error("jack.version must be an Array, was " + env["jack.version"]);
        
    // * <tt>rack.url_scheme</tt> must either be +http+ or +https+.
    if (env["jack.url_scheme"] !== "http" && env["jack.url_scheme"] !== "https")
        throw new Error("jack.url_scheme unknown: " + env["jack.url_scheme"]);
    
    // * There must be a valid input stream in <tt>jack.input</tt>.
    this.check_input(env["jack.input"]);
    // * There must be a valid error stream in <tt>jack.errors</tt>.
    this.check_error(env["jack.errors"]);
    
    // * The <tt>REQUEST_METHOD</tt> must be a valid token.
    if (!(/^[0-9A-Za-z!\#$%&'*+.^_`|~-]+$/).test(env["REQUEST_METHOD"]))
        throw new Error("REQUEST_METHOD unknown: " + env["REQUEST_METHOD"]);

    // * The <tt>SCRIPT_NAME</tt>, if non-empty, must start with <tt>/</tt>
    if (env["SCRIPT_NAME"] && env["SCRIPT_NAME"].charAt(0) !== "/")
        throw new Error("SCRIPT_NAME must start with /");
    
    // * The <tt>PATH_INFO</tt>, if non-empty, must start with <tt>/</tt>
    if (env["PATH_INFO"] && env["PATH_INFO"].charAt(0) !== "/")
        throw new Error("PATH_INFO must start with /");
    
    // * The <tt>CONTENT_LENGTH</tt>, if given, must consist of digits only.
    if (env["CONTENT_LENGTH"] !== undefined && !(/^\d+$/).test(env["CONTENT_LENGTH"]))
        throw new Error("Invalid CONTENT_LENGTH: " + env["CONTENT_LENGTH"]);

    // * One of <tt>SCRIPT_NAME</tt> or <tt>PATH_INFO</tt> must be
    //   set.  <tt>PATH_INFO</tt> should be <tt>/</tt> if
    //   <tt>SCRIPT_NAME</tt> is empty.
    if (env["SCRIPT_NAME"] === undefined && env["PATH_INFO"] === undefined)
        throw new Error("One of SCRIPT_NAME or PATH_INFO must be set (make PATH_INFO '/' if SCRIPT_NAME is empty)")
        
    //   <tt>SCRIPT_NAME</tt> never should be <tt>/</tt>, but instead be empty.
    if (env["SCRIPT_NAME"] === "/")
        throw new Error("SCRIPT_NAME cannot be '/', make it '' and PATH_INFO '/'")
}
Jack.Lint.prototype.check_input = function(input) {
    // FIXME:
    /*["gets", "each", "read"].each(function(method) {
        if (typeof input[method] !== "function")
            throw new Error("jack.input " + input + " does not respond to " + method);
    });*/
}
Jack.Lint.prototype.check_error = function(error) {
    ["puts", "write", "flush"].each(function(method) {
        if (typeof error[method] !== "function")
            throw new Error("jack.error " + error + " does not respond to " + method);
    });
}
Jack.Lint.prototype.check_status = function(status) {
    if (!(parseInt(status) >= 100))
        throw new Error("Status must be >=100 seen as integer");
}
Jack.Lint.prototype.check_headers = function(headers) {
    for (var key in headers) {
        var value = headers[key];
        // The header keys must be Strings.
        if (typeof key !== "string")
            throw new Error("header key must be a string, was " + key);
            
        // The header must not contain a +Status+ key,
        if (key.toLowerCase() === "status")
            throw new Error("header must not contain Status");
        // contain keys with <tt>:</tt> or newlines in their name,
        if ((/[:\n]/).test(key))
            throw new Error("header names must not contain : or \\n");
        // contain keys names that end in <tt>-</tt> or <tt>_</tt>,
        if ((/[-_]$/).test(key))
            throw new Error("header names must not end in - or _");
        // but only contain keys that consist of
        // letters, digits, <tt>_</tt> or <tt>-</tt> and start with a letter.
        if (!(/^[a-zA-Z][a-zA-Z0-9_-]*$/).test(key))
            throw new Error("invalid header name: " + key);
        // The values of the header must respond to #each.
        if (typeof value.each !== "function")
            throw new Error("header values must respond to #each, but the value of '" + key + "' doesn't")
            
        value.each(function(item) {
            // The values passed on #each must be Strings
            if (typeof item !== "string")
                throw new Error("header values must consist of Strings, but '" + key + "' also contains " + item);
            // and not contain characters below 037.
            if ((/[\000-\037]/).test(item))
                throw new Error("invalid header value " + key + ": " + item);
        });
    }
}
Jack.Lint.prototype.check_content_type = function(status, headers) {
    var contentType = HashP.includes(headers, "Content-Type"),
        noBody = Jack.Utils.STATUS_WITH_NO_ENTITY_BODY(parseInt(status));
    
    if (noBody && contentType)
        throw new Error("Content-Type header found in " + status + " response, not allowed");
    if (!noBody && !contentType)
        throw new Error("No Content-Type header found");
}
Jack.Lint.prototype.check_content_length = function(status, headers, env) {
    var chunked_response = (HashP.includes(headers, "Transfer-Encoding") && HashP.get(headers, "Transfer-Encoding") !== 'identity');
    
    if (HashP.includes(headers, "Content-Length")) {
        var value = HashP.get(headers, "Content-Length");
        // There must be a <tt>Content-Length</tt>, except when the
        // +Status+ is 1xx, 204 or 304, in which case there must be none
        // given.
        if (Jack.Utils.STATUS_WITH_NO_ENTITY_BODY(parseInt(status)))
            throw new Error("Content-Length header found in " + status + " response, not allowed");

        if (chunked_response)
            throw new Error('Content-Length header should not be used if body is chunked');

        var bytes = 0,
            string_body = true;

        this.body.each(function(part) {
            if (typeof part !== "string")
                string_body = false;
            bytes += (part && part.length) ? part.length : 0;
        });

        if (env["REQUEST_METHOD"] === "HEAD")
        {
            if (bytes !== 0)
                throw new Error("Response body was given for HEAD request, but should be empty");
        }
        else if (string_body)
        {
            if (value !== bytes.toString())
                throw new Error("Content-Length header was "+value+", but should be " + bytes);
        }
    }
    else {
        if (!chunked_response && (typeof this.body === "string" || isArray(this.body)))
            if (Jack.Utils.STATUS_WITH_NO_ENTITY_BODY(parseInt(status)))
                throw new Error('No Content-Length header found');
    }
}
