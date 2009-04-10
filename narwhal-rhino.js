(function() {
    if (typeof NARWHAL_HOME == "undefined")
        NARWHAL_HOME = Packages.java.lang.System.getenv("NARWHAL_HOME");
    
    $LOAD_PATH = NARWHAL_HOME + "/lib";
    
    print = function(string) {
        Packages.java.lang.System.out.println(String(string));
    }
    
    _readFile = function(filePath) {
		var fis = new Packages.java.io.FileInputStream(new Packages.java.io.File(filePath)),
		    bytes = Packages.java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, fis.available());
		fis.read(bytes);
		fis.close();
	 	return String(new Packages.java.lang.String(bytes));
	}
    
    eval(_readFile(NARWHAL_HOME + "/narwhal.js"));
    //load(NARWHAL_HOME + "/narwhal.js");
})();
