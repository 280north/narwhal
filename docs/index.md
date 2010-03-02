
<script>
function addEvent(obj, evType, fn) { 
 if (obj.addEventListener){ 
   obj.addEventListener(evType, fn, false); 
   return true; 
 } else if (obj.attachEvent){ 
   var r = obj.attachEvent("on"+evType, fn); 
   return r; 
 } else { 
   return false; 
 } 
}

addEvent(window, 'load',
    function() {
        document.getElementById('github_notice').style.display='none';
    }
);
</script>

Narwhal
=======

A general purpose JavaScript platform
-------------------------------------

Narwhal is a cross-platform, multi-interpreter, general purpose JavaScript
platform. It aims to provide a solid foundation for building JavaScript
applications, primarily outside the web browser. Narwhal includes a package
manager, module system, and standard library for multiple JavaScript
interpreters. Currently Narwhal's [Rhino](http://www.mozilla.org/rhino/)
support is the most complete, but [other engines](engines.html) are available
too.

Narwhal's standard library conforms to the [CommonJS
standard](http://wiki.commonjs.org). It is designed to work with multiple
JavaScript interpreters, and to be easy to add support for new interpreters.
Wherever possible, it is implemented in pure JavaScript to maximize reuse of
code among engines.

Combined with [Jack](http://jackjs.org/), a
[Rack](http://rack.rubyforge.org/)-like
[JSGI](http://jackjs.org/jsgi-spec.html) compatible library, Narwhal provides a
platform for creating server-side JavaScript web applications and frameworks
such as [Nitro](http://www.nitrojs.org/).


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

<div id="github_notice">
<strong>Note:</strong> If you are viewing this on GitHub, the links below will
not work. Find the pages listed below in the <strong>docs/</strong> directory
of this repository.
</div>

* [Quick Start](quick-start.html)
* [Packages](packages.html)
* [How to Install Packages](packages.html)
* [How to Build Packages](packages-howto.html)
* [Modules](modules.html)
* [Virtual Environments / Seas](sea.html)
* [How to Build Engines](engines.html)
* [How Narwhal Works](narwhal.html)

### Quick Start

Download Narwhal.

* download and extract the
  [zip](http://github.com/280north/narwhal/zipball/0.2) or
  [tar](http://github.com/tlrobinson/narwhal/tarball/0.2) archive, or
* `git clone git://github.com/280north/narwhal.git`

Put Narwhal on your `PATH` environment variable.

* `export PATH=$PATH:~/narwhal/bin`, or
* `source narwhal/bin/activate`

Run `narwhal` or `js` (they are equivalent).

* `js narwhal/examples/hello`

Look at the options for Narwhal.

* `js --help`

And for Tusk, the package manager and virtual environment tool.

* `tusk help`

### My First Web Server

Create a project "hello-web".

    tusk init hello-web
    cd hello-web

Enter your project as a "virtual environment" using `activate` or `sea` so that
its libraries, binaries, and packages get automatically installed when you run
Narwhal.

    source bin/activate

or

    bin/sea

Install some packages you will need, like Jack, the JSGI standard library for
interoperable web services.

    tusk install jack

Tusk gets downloaded and installed at "hello-web/packages/jack".

Create your `jackconfig.js`.

    exports.app = function(env) {
        var text = "Hello, Web!";
        return {
            status : 200,
            headers : {
                "Content-Type" : "text/plain",
                "Content-Length" : String(text.length)
            },
            body : [text]
        };
    };

Run it!

    jackup

`jackup` looks for a file called `jackconfig.js` in the current directory, or
you can specify a path to a Jack application.

Open [http://localhost:8080/](http://localhost:8080/) in your web browser.

### Module System Basics

Narwhal "scripts" are [CommonJS](http://wiki.commonjs.org/wiki/Modules/1.1)
compatible modules, much like Python or Ruby modules.  You do not have to use
module pattern boilerplate; every module has its own local scope.  You can get
the exports object of another module by calling `require`.

    var FS = require("file");
    FS.isFile("foo.txt");

Module identifiers for `require` come in three flavors: "top-level",
"relative", and "absolute".  In the above case, `file` is a "top-level"
identifier, so it will load any module called `file.js` in the `lib` directory
of whichever package comes first in the load path.  Relative identifiers have
`.` or `..` as their first term, and terms are delimited with `/`.  So, in the
`foo/bar` module, `require('./baz')` will load `foo/baz`.  Absolute module
identifiers should not be used directly, but are produced when you execute a
program module outside the module path.  The module is identified by its
fully-qualified path, starting with `/`.

You can export an object by assigning it to `exports`.

    exports.foo = function () {
        return "Hello";
    };

In a module, you also get a `module` object that has `module.id` and
`module.path` properties so you can inspect your own top-level module
identifier, and the path of your own module file.  You also get a
`require.main` property that tells you the top-level module identifier of the
module that started the program.

    if (require.main == module)
        main();

    var settings = require(require.main);

    var FS = require("file");
    var path = FS.path(module.path);
    var indexHtml = path.resolve("./template/index.html").read();

Beyond the CommonJS specification, you also get the `print` function and the
`system` module object for free.  The `print` function accepts variadic
arguments and writes a single line containing the arguments delimited by spaces
to standard output and flushes.  The `system` module can be explicitly required
with `require("system")` as is encouraged since it is necessary for CommonJS
compliance.  Do not use `print` or `system` in standard libraries.


### Summary of Included Modules

 * `system`: `args`, `env`, `stdin`, `stdout`, `stderr`
 * `io`: `ByteIO` (`read`, `write`, `toByteString`, `toString`), `StringIO`
   (`read`, `write`, `copy`, `flush`, `iterator`, `forEach`, `readLine`,
   `readLines`, `next`, `print`, `toString`, `substring`, `slice`, `substr`), `IO`
   (`read`, `write`, `copy`, `flush`, `close`, `isatty`), `TextInputStream`
   (`raw`, `readLine`, `next`, `iterator`, `forEach`, `close`), `TextOutputStream`
   (`write`, `writeLine`, `writeLines`, `print`, `flush`, `close`)
 * `file`: `open`, `read`, `write`, `copy`, `link`, `symlink`, `rename`,
   `move`, `remove`, `mkdir`, `mkdirs`, `rmdir`, `rmtree`, `touch`, `chmod`,
   `chown`, `list`, `listTree`, `listDirectoryTree`, `copyTree`, `isAbsolute`,
   `isRelative`, `isDrive`, `isReadable`, `isWritable`, `glob`, `globPaths`,
   `fnmatch`, `match`, `cwd`, `cwdPath`, `join`, `split`, `resolve`,
   `relative`, `absolute`, `normal`, `canonical`, `root`, `dirname`,
   `basename`, `extension`, `path`, `new Path` (`to`, `from`, ...)
 * `os`: `exit`, `sleep`, `popen` (`wait`, `stdin`, `stdout`, `stderr`,
   `communicate` (`status`, `stdin`, `stdout`, `stderr`)), `system`, `command`,
   `status`, `enquote`
 * `binary`: `Binary` (`toArray`, `toByteArray`, `toByteString`, `indexOf`,
   `lastIndexOf`, `valueOf`), `ByteString` (`length`, `toString`, `split`,
   `slice`, `substr`, `substring`, `toSource`), `ByteArray` (`toString`, `pop`,
   `push`, `extendRight`, `unshift`, `extendLeft`, `reverse`, `slice`,
   `splice`, `split`, `forEach`, `every`, `some`, `map`, `reduce`,
   `reduceRight`, `displace`, `toSource`)
 * `assert`: `AssertionError`, `fail`, `ok`, `equal`, `notEqual`, `deepEqual`,
   `notDeepEqual`, `strictEqual`, `notStrictEqual`, `throws`, `Assert` (`pass`,
   `error`, `section`)
 * `test`: `run`, `Log` (`flush`, `pass`, `fail`, `error`, `begin`, `end`,
   `report`, `print`, `section`, `Assert`), `Section` (`print`)
 * `util`: `operator`, `no`, `object`, `array`, `string`, `apply`, `copy`,
   `deepCopy`, `repr`, `keys`, `values`, `items`, `len`, `has`, `get`, `set`,
   `getset`, `cut`, `put`, `first`, `last`, `update`, `deepUpdate`, `complete`,
   `deepComplete`, `remove`, `range`, `forEach`, `forEachApply`, `map`,
   `mapApply`, `every`, `some`, `all`, `any`, `reduce`, `reduceRight`, `zip`,
   `transpose`, `enumerate`, `is`, `eq`, `ne`, `lt`, `gt`, `le`, `ge`, `mul`,
   `by`, `compare`, `sort`, `sorted`, `reverse`, `reversed`, `hash`, `unique`,
   `escape`, `enquote`, `expand`, `trim`, `trimBegin`, `trimEnd`, `padBegin`,
   `padEnd`, `splitName`, `joinName`, `lower`, `upper`, `camel`, `title`
 * `http`: `open`, `read`
 * `sha`, `sha256`, `md5`, `md4`, `crc32`: `hash`
 * `utf8`, `base64`, `base16`: `encode`, `decode`
 * `jsmin`: `encode`
 * `jsonpath`: `resolve`
 * `logger`: `Logger` (`add`, `format`)
 * `args`: `Parser` (`parse`, `option`, (`_`, `__`, `name`, `displayName`,
   `getName`, `getDisplayName`, `action`, `set`, `push`, `inc`, `dec`,
   `choices`, `def`, `validate`, `input`, `output`, `number`, `oct`, `hex`,
   `integer`, `natural`, `whole`, `bool`, `todo`, `inverse`, `help`, `halt`,
   `hidden`), `group` (`option`), `def`, `reset`, `command`, `arg`, `args`,
   `act`, `action`, `helpful`, `usage`, `help`, `printHelp`, `printUsage`,
   `printCommands`, `printOption`, `printOptions`, `error`, `exit`, `print`,
   `check`), `UsageError`, `ConfigurationError`
 * `term`: `Stream` (`enable`, `disable`, `writeCode`, `print`, `printError`,
   `write`, `update`, `moveTo`, `moveBy`, `home`, `clear`, `clearUp`,
   `clearDown`, `clearLine`, `clearRight`, `error` (`print`, `write`)),
   `colors`, `stream`
 * `uuid`: `uuid`
 * `mime`: `bestMatch`, `parseMimeType`, `parseMediaRange`,
   `fitnessAndQualityParsed`, `qualityParsed`, `quality`
 * `html`: `escapeHTML`, `stripTags`
 * `ref-send`, `promise`, `events`: `when`, `defer` (`resolve`, `reject`,
   `promise`),
 * `event-loop`: `enqueue`
 * `printf`: `printf`, `fprintf`, `sprintf`
 * `querystring`: `unescape`, `escape`, `stringify`, `parseQuery`
 * `sandbox`: `Sandbox`
 * `loader`: `Loader` (`resolve`, `resolvePkg`, `find`, `fetch`, `load`,
   `reload`, `isLoaded`, `hasChanged`, `paths`, `extensions`), `resolve`,
   `resolvePkg`
 * `packages`: `order`, `catalog`
 * `interpreter`: `Context` (`eval`, `importScript`, `importScripts`, `Module`,
   `Function`)
 * `zip`: `unzip`, `Unzip` (`iterator`, `forEach`, `close`), `Entry`
   (`getName`, `isDirectory`, `open`, `read`, `copy`)

Contributors
------------

* [Tom Robinson](http://tlrobinson.net/)
* [Kris Kowal](http://askawizard.blogspot.com/)
* [George Moschovitis](http://www.gmosx.com/)
* [Kevin Dangoor](http://www.blueskyonmars.com/)
* Hannes Wallnöfer
* Sébastien Pierre
* Irakli Gozalishvili
* [Christoph Dorn](http://www.christophdorn.com/)
* Zach Carter
* Nathan L. Smith
* Jan Varwig
* Mark Porter
* [Isaac Z. Schlueter](http://blog.izs.me/)
* [Kris Zyp](http://www.sitepen.com/blog/author/kzyp/)
* [Nathan Stott](http://nathan.whiteboard-it.com/)
* [Toby Ho](http://tobyho.com)


License
-------

Copyright (c) 2009, 280 North Inc. <[280north.com](http://280north.com/)\>

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

