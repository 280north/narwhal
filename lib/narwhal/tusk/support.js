
// -- tlrobinson Tom Robinson

exports.supportsEngine = function() {
    // deprecated
    if (require("system").supportsTusk != undefined) {
        require("narwhal").deprecated("system.supportsTusk deprecated in favor of supportsEngine() function in 'narwhal/tusk/support' module.");
        return require("system").supportsTusk;
    }

    // attempt to feature detect the things needed by tusk
    var hasHttp = false, hasUnzip = false;
    try { hasHttp = !!require("http-client").open; } catch (e) {}
    try { hasUnzip = !!require("zip").Unzip; } catch (e) {}

    return hasHttp && hasUnzip;
}
