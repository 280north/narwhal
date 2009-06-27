
Narwhal, Tusk, and Sea
======================

Narwhal is your JavaScript interpreter.  It is executable with "narwhal" or "js".  See "narwhal --help" for a list of its options.  It is comparable to your shell, Python or Ruby/IRB.

Tusk is your package manager.  Tusk by default installs packages whereever "narwhal" is installed.  See "tusk help" for a list of options.  It is comparable to "apt" or "gem".  You can also use "tusk" to create new "packages", application project scaffolds, or "virtual environments", which are all the same thing.

"sea" is a tool for entering a Narwhal "virtual environment".  It executes a command or reexecutes your shell inside a "virtual environment".  There is a version of "sea" that comes packed with "Narwhal", which you can use to "enter" your system "narwhal" environment, which is handy if "narwhal/bin" is not on your path.  You can also source "activate.sh" if your current working directory is the package root you want to use for your Sea.

You can use "narwhal", "tusk", and "sea" to create multiple, independent, reproducable Narwhal project installations.  Assuming that "narwhal" and "tusk" are on your path, you can use "tusk init" to create two application projects.

    $ tusk init foo
    $ tusk init bar
    $ cd foo
    foo$ bin/sea
    PATH=foo/bin
    SEALVL=1
    foo$ tusk install jack
    foo$ edit jackconfig.js
    foo$ jackup
    Loading configuration module at foo/jackconfig
    Jack is starting up using Simple on port 8080
    ^C
    foo$ echo $SEA
    foo
    foo$ which sea
    foo/bin/sea
    foo$ exit
    SEALVL=0
    foo$ cd ../bar
    bar$ bin/sea
    PATH=bar/bin
    SEALVL=1
    ...

When you are in a Sea, Narwhal loads all of the packages installed in that Sea and Tusk installs packages in your Sea.  While you can manipulate the NARWHAL_PATH and JS_PATH environment variables manually, Seas obviate the need.

Each sea can also have a different JavaScript engine.  Edit narwhal.conf in your Sea to use a different engine.

    $ js -e 'print(system.platform)'
    rhino
    $ cat bar/narwhal.conf
    NARWHAL_DEFAULT_PLATFORM=v8
    $ bar/bin/sea 'js -e "print(system.platform)"'
    v8
    PATH=/bin
    SEALVL=0

