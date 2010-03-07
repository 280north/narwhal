
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

var FS = require("file");
var HTTP = require("http-client");
var URI = require("uri");
var ASSERT = require("assert");

var Store = exports.Store = function (path) {
    this.path = FS.path(path).canonical();
};

Store.prototype.get = function (url) {
    var parsed = URI.parse(url);
    if (parsed.scheme == "http") {
        ASSERT.ok(parsed.authority, "URI store URI's must be fully qualified");
        ASSERT.ok(parsed.root, "URI store URI's must be fully qualified");
        return this.path.join.apply(
            this.path,
            [parsed.authority]
            .concat(parsed.directories)
            .concat([parsed.file])
        );
    } else if (parsed.scheme == "file") {
        var base = parsed.authorityRoot || parsed.root ?
            FS.path('/'):
            FS.cwdPath();
        return base.join.apply(
            base,
            parsed.directories.concat([parsed.file])
        );
    } else {
        ASSERT.ok(false, "URI scheme must be http or file");
    }
};

Store.prototype.has = function (url) {
    return this.get(url).isFile();
};

Store.prototype.download = function (url, path) {
    if (!path)
        path = this.get(url);
    path.dirname().mkdirs();
    var parsed = URI.parse(url);
    if (parsed.scheme == "http")
        HTTP.open(url, 'rb').copy(path.open('wb'));
}

Store.prototype.open = function (url, mode, options) {
    var path = this.get(url);
    if (!path.isFile())
        this.download(url, path);
    return path.open(mode, options);
};

Store.prototype.read = function (url, options) {
    var stream = this.open(url, "r", options);
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
    var store = new Store(TUSK.getTuskDirectory().join("http"));
    print(store.get('file:here.json'));
    //print(store.get(url));
    //print(store.read(url));
}

