/**
 * 
 * Reference:
 *  - https://developer.mozilla.org/en/NsIFile
 * 
 */

var IO = require("./io").IO;
var file = require('file');

const Cc = Components.classes;
const Ci = Components.interfaces;
const EM = Cc["@mozilla.org/extensions/manager;1"].getService(Ci.nsIExtensionManager);
const ID = system.env.bootloader.platform.mozilla.extension.id;


var MozillaFile = function (path) {
  return EM.getInstallLocation(ID).getItemFile(ID, path);
};


exports.FileIO = function (path, mode, permissions) {
    path = MozillaFile(path);

    var {
        read: read,
        write: write,
        append: append,
        update: update
    } = file.mode(mode);

    if (update) {
        throw new Error("Updating IO not yet implemented.");
    } else if (write || append) {

        var stream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                                createInstance(Components.interfaces.nsIFileOutputStream);
        stream.init(path, -1, -1, 0);
        return new IO(stream, null);
    } else if (read) {

        var stream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                                createInstance(Components.interfaces.nsIFileInputStream);
        stream.init(path, -1, 0, 0);
        return new IO(stream, null);
    } else {
        throw new Error("Files must be opened either for read, write, or update mode.");
    }
};



/* paths */

exports.SEPARATOR = '/';
exports.ALT_SEPARATOR = undefined;
exports.ROOT = '/';

exports.canonical = function(path) {
    var original;

    do {
        original = path;
        path = path
            .replace(/[^\/]+\/\.\.\//g, "")
            .replace(/([^\.])\.\//g, "$1")
            .replace(/^\.\//g, "")
            .replace(/\/\/+/g, "/");
    } while (path !== original);
        
    return path;
}

exports.isFile = function (path) {
    try { return MozillaFile(path).exists(); } catch (e) {}
    return false;
};

exports.isDirectory = function (path) {
    try { return MozillaFile(path).isDirectory(); } catch (e) {}
    return false;
};
