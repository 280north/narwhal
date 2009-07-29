Narwhal
=======

A general purpose JavaScript platform
-------------------------------------

Narwhal is a cross-platform, multi-interpreter, general purpose JavaScript platform. It aims to provide a solid foundation for building JavaScript applications, primarily outside the web browser. Narwhal includes a package manager, module system, and standard library for multiple JavaScript interpreters. Currently Narwhal's [Rhino](http://www.mozilla.org/rhino/) support is the most complete, but [other platforms](platforms.html) are available too.

Narwhal's standard library conforms to the [ServerJS standard](https://wiki.mozilla.org/ServerJS). It is designed to work with multiple JavaScript interpreters, and to be easy to add support for new interpreters. Wherever possible, it is implemented in pure JavaScript to maximize reuse of code among platforms.

Combined with [Jack](http://jackjs.org/), a [Rack](http://rack.rubyforge.org/)-like [JSGI](http://jackjs.org/jsgi-spec.html) compatible library, Narwhal provides a platform for creating server-side JavaScript web applications and frameworks such as [Nitro](http://www.nitrojs.org/).


### Homepage:

* [http://narwhaljs.org/](http://narwhaljs.org/)

### Source & Download:

* [http://github.com/tlrobinson/narwhal/](http://github.com/tlrobinson/narwhal/)

### Mailing list:

* [http://groups.google.com/group/narwhaljs](http://groups.google.com/group/narwhaljs)

### IRC:

* [\#narwhal on irc.freenode.net](http://webchat.freenode.net/?channels=narwhal)


Documentation
-------------

* [Quick Start](quick-start.html)
* [Packages](packages.html)
* [How to Install Packages](packages.html)
* [How to Build Packages](packages-howto.html)
* [Modules](modules.html)
* [Virtual Environments / Seas](sea.html)
* [How to Build Platforms](platforms.html)
* [How Narwhal Works](narwhal.html)


Contributors
------------

* [Tom Robinson](http://tlrobinson.net/)
* [Kris Kowal](http://askawizard.blogspot.com/)
* [George Moschovitis](http://blog.gmosx.com/)
* [Kevin Dangoor](http://www.blueskyonmars.com/)
* Hannes Wallnöfer
* Sébastien Pierre
* Irakli Gozalishvili
* Christoph Dorn
* Zach Carter
* Nathan L. Smith
* Jan Varwig
* Mark Porter


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

