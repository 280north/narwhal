
var SYSTEM = require("system");
var FILE = require("file");
var PACKAGES = require("packages");
var UTIL = require("util");
var TERM = require("term");
var Bundler = require("./server").Bundler;

exports.ids = function (system, packages) {
    if (!packages)
        packages = PACKAGES;
    if (!system)
        system = SYSTEM;

    // scan the package order for all possibly relevant
    // javascript files for the given system

    var files = [];
    packages.order.forEach(function (info) {
        var enginePaths = info.engines || 'engines';
        if (typeof enginePaths == "string")
            enginePaths = [enginePaths];
        system.engines.forEach(function (engine) {
            enginePaths.forEach(function (enginePath) {
                enginePath = enginePath + '/' + engine;
                var enginePath = info[enginePath] || enginePath;
                if (typeof enginePath == "string")
                    enginePath = [enginePath];
                enginePath.forEach(function (enginePaths) {
                    enginePaths = enginePath + '/lib';
                    var enginePath = info[enginePaths] || enginePaths;
                    if (typeof enginePath == "string")
                        enginePath = [enginePath];
                    enginePath.forEach(function (enginePath) {
                        enginePath = info.directory.join(enginePath);
                        enginePath.globPaths("**.js").forEach(function (path) {
                            files.push([path, enginePath]);
                        });
                    });
                });
            });
        });
        info.lib.forEach(function (lib) {
            lib.globPaths("**.js").forEach(function (path) {
                files.push([path, lib]);
            });
        });
    });

    // transform paths into identifiers
    var ids = UTIL.mapApply(files, function (path, base) {
        var relative = path.from(base.join(''));
        var parts = relative.split();
        parts.pop();
        parts.push(relative.basename('.js'));
        var id = parts.join('/');
        //print(id + ' ' + path + ' ' + base);
        return id;
    });

    ids = UTIL.unique(ids);

    return ids;
};

exports.build = function (location, system, packages) {

    if (!system)
        system = SYSTEM;
    system = Object.create(system);
    system.engine = "browser";
    system.engines = UTIL.copy(system.engines);
    system.engines.unshift("browser");

    location = FILE.path(location);
    var bundler = Bundler(system);
    exports.ids(system, packages).forEach(function (id) {
        try {
            var parts = id.split('/');
            var basename = parts.pop();
            var dirname = location.join.apply(location, parts);
            dirname.mkdirs();
            var path = dirname.join(basename + '.js');
            path.write(bundler.bundle([id]));
            print(path);
        } catch (exception) {
            TERM.stream.print("\0red(" + exception + "\0)");
        }
    });

};

exports.main = function (system, packages) {
    exports.build("build", system, packages);
};

if (require.main == module.id)
    exports.main();

