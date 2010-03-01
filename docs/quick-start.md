
Narwhal Quick Start
===================

Download Narwhal.

* download and extract the [zip](http://github.com/280north/narwhal/zipball/master) or [tar](http://github.com/280north/narwhal/tarball/master) archive, or
* `git clone git://github.com/280north/narwhal.git`

Put Narwhal on your PATH environment variable.

* `export PATH=$PATH:~/narwhal/bin`, or
* `source narwhal/bin/activate`

Run `narwhal` or `js` (they are equivalent).

* `js narwhal/examples/hello`

Look at the options for Narwhal.

* `js --help`

And for Tusk, the package manager and virtual environment tool.

* `tusk help`


My First Web Server
===================

Create a project "hello-web".

    tusk init hello-web
    cd hello-web

Enter your project as a "virtual environment" using `activate` or `sea` so that its libraries, binaries, and packages get automatically installed when you run Narwhal.

    source bin/activate

or

    bin/sea

Install some packages you will need, like Jack, the JSGI standard library for interoperable web services.

    tusk install jack

Tusk gets downloaded and installed at "hello-web/packages/jack".

Create your "jackconfig.js". This is a trivial JSGI compatible application, wrapped in the `ContentLength` middleware to automatically set the "Content-Length" header.

    exports.app = function(env) {
        var text = "Hello, Web!";
        return {
            status : 200,
            headers : { "Content-Type" : "text/plain", "Content-Length" : String(text.length) },
            body : [text]
        };
    };

Run it!

    jackup

`jackup` looks for a file called `jackconfig.js` in the current directory, or you can specify a path to a Jack application.

Open [http://localhost:8080/](http://localhost:8080/) in your web browser.

Next, take a look at the introduction to [modules](modules.html), for a primer on using and making modules in Narwhal.
