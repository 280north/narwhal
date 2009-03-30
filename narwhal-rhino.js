(function() {
    var NARWHAL_HOME = Packages.java.lang.System.getenv("NARWHAL_HOME");
    
    $LOAD_PATH = NARWHAL_HOME + "/lib";
    
    load(NARWHAL_HOME + "/narwhal.js");
})();