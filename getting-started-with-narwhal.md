---
layout: default
title: narwhal - getting started with narwhal
---
Getting Started With Narwhal
============================

One of the goals of Narwhal is have a drop dead simple installation process.

1. Prerequisites: Java 1.5 or higher installed on Mac OS X or Linux.
2. [Download](http://github.com/tlrobinson/narwhal/zipball/master) or [checkout](http://github.com/tlrobinson/narwhal) the latest version of Narwhal.
3. Add the `bin` directory from Narwhal to your PATH environment variable (e.x. `export PATH=$HOME/narwhal/bin:$PATH` if you've put Narwhal in your home directory).
4. Execute `narwhal` to enter the Narwhal shell, or `narwhal filename.js` to run a script.

Example Usage
-------------

The following simple program will read the file specified on the command line, and write it out with all text converted to uppercase:

    #!/usr/bin/env narwhal
    var File = require("file");

    var text = File.read(system.args[1]);
    File.write(system.args[1], text.toUpperCase());
