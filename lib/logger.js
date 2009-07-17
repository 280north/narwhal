// Logging
// 
// FATAL:	an unhandleable error that results in a program crash
// ERROR:	a handleable error condition
// WARN:	a warning
// INFO:	generic (useful) information about system operation
// DEBUG:	low-level information for developers
// (Stolen from Ruby)
//

var Logger = exports.Logger = function(output) {
    if (typeof output === "string")
        this.output = system.fs.open(output, "a");
    else
        this.output = output;
        
    this.level = Logger.INFO;
};

Logger.FATAL = 0;
Logger.ERROR = 1;
Logger.WARN  = 2;
Logger.INFO  = 3;
Logger.DEBUG = 4;

Logger.SEV_LABEL = ["FATAL", "ERROR", "WARN" , "INFO" , "DEBUG"];

Logger.prototype.fatal = function() {
    return this.add(Logger.FATAL, this.format(Logger.FATAL, arguments));
};
Logger.prototype.error = function() {
    return this.add(Logger.ERROR, this.format(Logger.ERROR, arguments));
};
Logger.prototype.warn = function() {
    return this.add(Logger.WARN, this.format(Logger.WARN, arguments));
};
Logger.prototype.info = function() {
    return this.add(Logger.INFO, this.format(Logger.INFO, arguments));
};
Logger.prototype.debug = function() {
    return this.add(Logger.DEBUG, this.format(Logger.DEBUG, arguments));
};

Logger.prototype.add = function(severity, message, progname) {
    if (severity > this.level)
        return false;
    this.output.write(message || progname);
};

Logger.prototype.format = function(severity, args) {
    return new Date() + " ["+Logger.SEV_LABEL[severity].toLowerCase()+"] " +Array.prototype.join.apply(args, [" "]).replace(/\n/g, "");
};

