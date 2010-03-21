// use the Rhino shell, in case stdin is coming from the debugger GUI (this will still use jline)
var reader = system.stdin;

exports.readline = function() {
    var line = reader.readLine();
    if(line === null){
        // jline will fail in eclipse, revert to the default impl
        exports.readline = function(){
            return system.stdin.readLine();
        };
        return exports.readline();
    }
    
    return String(line);
}
