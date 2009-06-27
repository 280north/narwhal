// Logging
// 
// FATAL:	an unhandleable error that results in a program crash
// ERROR:	a handleable error condition
// WARN:	a warning
// INFO:	generic (useful) information about system operation
// DEBUG:	low-level information for developers
// (Stolen from Ruby)
//

// TODO: Make this more compliant
var Logger = exports.Logger = function (output) {};
Logger.prototype = Jaxer.Log.forModule("narwhal");
