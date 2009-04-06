(function() {
    /*
        this is a minimal platform-specific thunk for narwhal.js
        that brings the NARWHAL_PATH environment variable into the global
        scope using Rhino's special access to Java.
     */

    var NARWHAL_HOME = String(Packages.java.lang.System.getenv("NARWHAL_HOME"));
    var NARWHAL_PATH = String(Packages.java.lang.System.getenv("NARWHAL_PATH"));

    $NARWHAL_PATH = NARWHAL_PATH;

    load(NARWHAL_HOME + "/narwhal.js");
})();
