Narwhal: A flexible server-side JavaScript standard library
===========================================================

Narwhal is a server-side JavaScript standard library conforming to the [ServerJS standard](https://wiki.mozilla.org/ServerJS). It is designed to work with multiple JavaScript interpreters, and to be easy to add support for new interpreters. Wherever possible, it is implemented in pure JavaScript to maximize reuse of code between platforms.


Packages
--------

A package consists of a directory of modules conforming to the ServerJS [Securable Modules](https://wiki.mozilla.org/ServerJS/Modules/SecurableModules) specification, and a "packages.json" file in the root of the package containing the location of the modules, depedencies, and other metadata.


Platforms
---------

To add Narwhal to a new platform, you need two main things:

1. A "thunk" which sets up a fixtures object with a few required objects, then loads "narwhal.js" (usually consists of a shell script at "bin/PLATFORM" and short JavaScript file at "narwhal-PLATFORM.js")

2. Platform implemenations for core modules, such as File (located in "platforms/PLATFORM")


Available Packages
------------------

* Jack: the webserver and web application/framework agnostic interface, similar to Ruby's Rack and Python's WSGI. Narwhal was concieved while building Jack, and was later extracted into it's own project.

[http://github.com/tlrobinson/jack](http://github.com/kriskowal/chiron)

* Chiron: a system of interoperable JavaScript modules, including a type system, base types, general-purpose functions, events, encoding, decoding, hashing, and caching.

[http://github.com/kriskowal/chiron](http://github.com/kriskowal/chiron)
  
* Nitro: a web application framework built on top of Jack.

[http://github.com/gmosx/nitro](http://github.com/gmosx/nitro)

* getjs: a JavaScript package manager for ServerJS implementations

[http://github.com/dangoor/getjs](http://github.com/dangoor/getjs)


Contributors
------------

* Tom Robinson
* Kris Kowal
* George Moschovitis
* Kevin Dangoor


License
-------

Copyright (c) 2009 Thomas Robinson <tlrobinson.net>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
