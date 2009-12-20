
exports.read = function (url) {
    try {
        return new HTTP.ClientRequest(url).send(true).data;
    } finally {
    }
};

