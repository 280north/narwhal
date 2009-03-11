var Utils = exports;

// Every standard HTTP code mapped to the appropriate message.
// Stolen from Rack which stole from Mongrel ;)
Utils.HTTP_STATUS_CODES = {
    100 : 'Continue',
    101 : 'Switching Protocols',
    200 : 'OK',
    201 : 'Created',
    202 : 'Accepted',
    203 : 'Non-Authoritative Information',
    204 : 'No Content',
    205 : 'Reset Content',
    206 : 'Partial Content',
    300 : 'Multiple Choices',
    301 : 'Moved Permanently',
    302 : 'Found',
    303 : 'See Other',
    304 : 'Not Modified',
    305 : 'Use Proxy',
    307 : 'Temporary Redirect',
    400 : 'Bad Request',
    401 : 'Unauthorized',
    402 : 'Payment Required',
    403 : 'Forbidden',
    404 : 'Not Found',
    405 : 'Method Not Allowed',
    406 : 'Not Acceptable',
    407 : 'Proxy Authentication Required',
    408 : 'Request Timeout',
    409 : 'Conflict',
    410 : 'Gone',
    411 : 'Length Required',
    412 : 'Precondition Failed',
    413 : 'Request Entity Too Large',
    414 : 'Request-URI Too Large',
    415 : 'Unsupported Media Type',
    416 : 'Requested Range Not Satisfiable',
    417 : 'Expectation Failed',
    500 : 'Internal Server Error',
    501 : 'Not Implemented',
    502 : 'Bad Gateway',
    503 : 'Service Unavailable',
    504 : 'Gateway Timeout',
    505 : 'HTTP Version Not Supported'
};

Utils.STATUS_WITH_NO_ENTITY_BODY = function(status) { return (status >= 100 && status <= 199) || status == 204 || status == 304; };

Utils.unescape = function(str) {
    // FIXME: implement
    return str;
}

Utils.parseQuery = function(queryString) {
    var params = {},
        pieces = (queryString.toString() || "").split(/&/g);
    for (var i = 0; i < pieces.length; i++) {
        var kv = pieces[i].split("=", 2);
        if (kv[0]) {
            var cur = params[kv[0]];
            if (cur) {
                if (isArray(cur))
                    cur.push(kv[1]);
                else
                    params[kv[0]] = [cur, kv[1]];
            }
            else {
                params[kv[0]] = kv[1];
            }
        }
    }
    return params;
}

var EOL = "\r\n";

Utils.parseMultipart = function(env) {
    var match;
    if (env['CONTENT_TYPE'] && (match = env['CONTENT_TYPE'].match(/^multipart\/form-data.*boundary=\"?([^\";,]+)\"?/m))) {
        var boundary = "--" + match[1],

            params = {},
            buf = "",
            contentLength = parseInt(env['CONTENT_LENGTH']),
            input = env['jack.input'],
            
            boundaryLength = boundary.length + EOL.length,
            bufsize = 16384;
            
        contentLength -= boundaryLength;
            
        var status = input.read(boundaryLength);
        if (status !== boundary + EOL)
            throw new Error("EOFError bad content body");

        var rx = new RegExp("(?:"+EOL+"+)?"+boundary+"("+EOL+"|--)");

        while (true) {
            var head = null,
                body = "",
                filename = null,
                contentType = null,
                name = null;

            while (!head || !rx.test(buf)) {
                if (!head && (i = buf.indexOf("\r\n\r\n")) > 0) {
                    head = buf.substring(0, i+2);
                    buf = buf.substring(i+4);
                    
                    match = head.match(/Content-Disposition:.* filename="?([^\";]*)"?/i);
                    filename = match && match[1];
                    match = head.match(/Content-Type: (.*)\r\n/i);
                    contentType = match && match[1];
                    match = head.match(/Content-Disposition:.* name="?([^\";]*)"?/i);
                    name = match && match[1];
                    
                    if (filename) {
                        log.warn("multipart file not implemented");
                        //body = Tempfile.new("JackMultipart")
                        //body.binmode  if body.respond_to?(:binmode)
                    }
                    continue;
                }

                // Save the read body part.
                if (head && (boundaryLength + 4 < buf.length)) {
                    body += buf.slice(0, buf.length - (boundaryLength + 4));
                    buf = buf.slice(buf.length - (boundaryLength + 4));
                }
                
                var c = input.read(bufsize < contentLength ? bufsize : contentLength);
                if (!c)
                    throw new Error("EOFError bad content body");

                buf += c;
                contentLength -= c.length;
            }

            // Save the rest.
            if (match = buf.match(rx)) {
                body += buf.slice(0, match.index);
                buf = buf.slice(match.index + boundaryLength + 2);

                if (match[1] === "--")
                    contentLength = -1;
            }

            if (filename) {
                //body.rewind();
                data = {
                    "filename"  : filename,
                    "type"      : contentType,
                    "name"      : name,
                    "tempfile"  : body,
                    "head"      : head
                };
            } else {
                data = body;
            }

            if (name) {
                if (/\[\]$/.test(name)) {
                    params[name] = params[name] || [];
                    params[name].push(data);
                } else {
                    params[name] = data;
                }
            }
            if (!buf || contentLength == -1)
                break;
        }
        
        return params;
    }
    
    return null;
}
