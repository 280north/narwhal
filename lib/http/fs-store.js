
var FS = require("file");
var HTTP = require("http");
var URI = require("uri");
var ASSERT = require("assert");

var HttpStore = exports.HttpStore = function (path) {
    this.path = FS.path(path).canonical();
};

HttpStore.prototype.get = function (url) {
    var parsed = URI.parse(url);
    ASSERT.ok(parsed.authority, "HTTP store URL's must be fully qualified");
    ASSERT.ok(parsed.root, "HTTP store URL's must be fully qualified");
    return this.path.join.apply(
        this.path,
        [parsed.authority]
        .concat(parsed.directories)
        .concat([parsed.file])
    );
};

HttpStore.prototype.has = function (url) {
    return this.get(url).isFile();
};

HttpStore.prototype.download = function (url, path) {
    if (!path)
        path = this.get(url);
    path.dirname().mkdirs();
    HTTP.open(url, 'rb').copy(path.open('wb'));
}

HttpStore.prototype.open = function (url, mode, options) {
    var path = this.get(url);
    if (!path.isFile())
        this.download(url, path);
    return path.open(mode, options);
};

HttpStore.prototype.read = function (url) {
    var stream = this.open(url);
    try {
        return stream.read();
    } finally {
        stream.close();
    }
};

if (require.main == module) {
    // test
    var url = "http://github.com/280north/narwhal/raw/master/catalog.json";
    var TUSK = require("narwhal/tusk");
    var store = new HttpStore(TUSK.getTuskDirectory().join("http"));
    //print(store.lookup(url));
    print(store.read(url));
}

