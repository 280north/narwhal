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

Utils.parseQuery = function(qs) {
    var params = {},
        pieces = (qs || "").split(/&/g);
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
