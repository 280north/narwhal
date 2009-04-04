(function() {
    var NARWHAL_HOME = Packages.java.lang.System.getenv("NARWHAL_HOME");
    var JSPATH = Packages.java.lang.System.getenv("JSPATH");
    var NARWHALPATH = Packages.java.lang.System.getenv("NARWHALPATH");

    $LOAD_PATH = NARWHAL_HOME + "/lib/platforms/rhino:" + NARWHAL_HOME + "/lib";
    if (JSPATH) $LOAD_PATH += ":" + JSPATH;
    if (NARWHALPATH) $LOAD_PATH += ":" + NARWHALPATH;
    
    load(NARWHAL_HOME + "/narwhal.js");
})();
