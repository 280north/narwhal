// use the 
var reader = new java.io.BufferedReader(new java.io.InputStreamReader(new org.mozilla.javascript.NativeJavaObject(global, org.mozilla.javascript.tools.shell.Main.global, null).getIn(), "UTF-8"));

exports.readline = function() {
    return String(reader.readLine());
}
