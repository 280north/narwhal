// Dir: Rhino

var Dir = exports;

Dir.pwd = function() {
    return String(Packages.java.lang.System.getProperty("user.dir"));
}
