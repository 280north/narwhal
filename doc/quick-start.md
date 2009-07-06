
Narwhal Quick Start
===================

Download Narwhal.

* download and extract the [zip](http://github.com/tlrobinson/narwhal/zipball/master) or [tar](http://github.com/tlrobinson/narwhal/tarball/master) archive, or
* `git clone git://github.com/tlrobinson/narwhal.git`

Put Narwhal on your PATH environment variable.

* `export PATH=$PATH:~/narwhal/bin`, or
* execute `narwhal/bin/sea` for a quick Narwhal subshell

Run `narwhal` or `js` (they're equivalent).

* `js narwhal/examples/hello`

Look at the options.

* `narwhal --help`
* `tusk help`


My First Web Server
===================

Create a project "hello-web".

    tusk init hello-web
    cd hello-web

Enter your project as a "virtual environment" using `sea` so that its libraries, binaries, and packages get automatically installed when you run Narwhal.

    bin/sea

Install some packages you will need, like Jack, the JSGI standard library for interoperable web services.

    tusk install jack

Tusk gets downloaded and installed at "hello-web/packages/jack".

Create your "jackconfig.js". This is a trivial JSGI compatible application, wrapped in the `ContentLength` middleware to automatically set the "Content-Length" header.

    var jack = require("jack");
    
    exports.app = jack.ContentLength(function (env) {
        return [200, {"Content-type": "text/plain"}, ["Hello, Web!"]];
    });

Run it!

    jackup

Next, take a look at the introduction to [modules](modules.html), for a primer on using and making modules in Narwhal.
