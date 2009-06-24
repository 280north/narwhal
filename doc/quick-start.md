
Quick Start
===========

download Narwhal.

* download http://github.com/tlrobinson/narwhal/zipball/master or
* git clone git://github.com/tlrobinson/narwhal.git

Put Narwhal on your PATH

* PATH=narwhal/bin or
* narwhal/bin/sea for a quick Narwhal subshell

Run "narwhal" or "js".

* js narwhal/examples/hello

Look at the options

* narwhal --help
* tusk help


My First Web Server
===================

Create a Project "hello-web".

    $ tusk init hello-web
    $ cd hello-web
    hello-web$ 

Enter your project as a "virtual environment" so that its libraries, binaries, and packages get automatically installed whenever you run Narwhal.

    hello-web$ bin/sea
    PATH=hello-web/bin
    SEALVL=1

Install some packages you will need, like Jack, the JSGI standard library for interoperable web services.

    hello-web$ tusk install jack

Tusk gets downloaded and installed at "hello-web/packages/jack".

Create your "jackconfig.js"

    var jack = require("jack");
    exports.app = jack.ContentLength(function (env) {
        return [200, {"Content-type": "text/plain"}, ["Hello, Web!"]];
    });

Run it!

    hello-web$ jackup

Take a look at the introduction to modules, modules.md in this directory, for a primer on using and making modules in Narwhal.

