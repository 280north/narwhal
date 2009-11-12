// use the 
var reader = new java.io.BufferedReader(new java.io.InputStreamReader(new org.mozilla.javascript.NativeJavaObject(global, org.mozilla.javascript.tools.shell.Main.global, null).getIn(), "UTF-8"));

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
