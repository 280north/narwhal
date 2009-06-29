// This is a wrapper around the Jaxer logger functionality.
// TODO: Allow different output destinations
var Logger = exports.Logger = function (output) {};
Logger.prototype = Jaxer.Log.forModule("narwhal");
