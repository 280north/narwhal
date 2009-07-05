
Platforms
=========

We have a template for new platforms at "platforms/template" that you can copy to "platforms/{name}" and fill in the blanks.  These consist of:

1. A shell script at "platforms/{name}/bin/platform-{name}" that executes the interpreter engine of choice and causes it to load a bootstrap script.  This script will be loaded by "bin/narwhal" with NARWHAL_HOME set to the Narwhal project directory.  This script will be run if NARWHAL_PLATFORM is set to your platform name.  You can set NARWHAL_DEFAULT_PLATFORM or NARWHAL_PLATFORM in a "narwhal.conf" in your Narwhal project directory (template provided).

2. A "thunk", at "platforms/{name}/bootstrap.js" that evaluates "narwhal.js" and passes the returned function a preliminary "system" object with a few required properties ("global", "evalGlobal", "platform", "platforms", "print", "evaluate", "prefix", "fs.read", and "fs.isFile").

2. Platform implemenations for core modules, such as "file" and "system" located in "platforms/{name}/lib/".  You can implement "file-platform" instead of "file" if you implement the subset of the ServerJS file API used by "lib/file.js".  To get things running, you must implement the file module's "list", "canonical", "mtime", "isDirectory", "isFile".

