var IO = require("io").IO,
    HashP = require("hashp").HashP;

exports.finish = function (tx) {
    var resp = {status:200, headers:{}, body:[]};
    
    var con = java.net.HttpURLConnection(new java.net.URL(tx.url).openConnection());
    con.setRequestMethod(tx.method.toUpperCase());
    
    HashP.forEach(tx.headers, function (h, v) {
        con.setRequestProperty(h, v);
    });
    
    var cl = HashP.get(tx.headers, "Content-Length") || 0;
    if (cl > 0) {
        con.setDoOutput(true);
        var os = null;
        try {
            os = con.getOutputStream();
        } catch (ex) {}
        if (os) {
            var writer = new IO(null, con.getOutputStream());
            tx.body.forEach(function (piece) {
                writer.write(piece);
            });
            writer.close();
        }
    }
    
    try {
        con.connect();
    } catch (ex) {
        // It would be nice to do something clever and special here,
        // but I'm not feeling it at the moment.
        ex.message = [
            "Could not connect to "+tx.url+". Probably a bad hostname.",
            ex.message
        ].join("\n");
        throw ex;
    }
    
    // now pull everything out.
    var fields = con.getHeaderFields();
    var fieldKeys = fields.keySet().toArray();
    for (var i = 0, l = fieldKeys.length; i < l; i ++ ) {
        var fieldValue = fields.get(fieldKeys[i]).toArray().join('');
        var fieldName = fieldKeys[i];
        if (fieldName === null) {
            // Something like: HTTP/1.1 200 OK
            HashP.set(resp, "status", /HTTP\/1\.[01] ([0-9]{3})/.exec(fieldValue)[1]);
            fieldName = "Status";
        }
        HashP.set(resp.headers, fieldName, fieldValue);
    }

    // this might be slow for really big things.
    var is = null;
    try {
        var is = con.getInputStream();
    } catch (ex) {}
    if (is) {
        //TODO - Just wrap the body.forEach in a reader function.
        var reader = new IO(con.getInputStream(), null);
        resp.body = [ reader.read() ];
        reader.close();
    }
    
    return resp;
};
