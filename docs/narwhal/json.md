
JSON Tool Recipes
=================

List the module search paths:

        json -e require.paths -np

List the package search prefixes:

        json -e system.prefixes -np

List the active engine names:

        json -e system.engines -np

List the prefix paths of every installed package:

        json -e 'require("packages").order' -n -f directory -p

Visit the home page of every contributor to every installed package.  "open" is
on Mac OS X only, but you can use "gnome-open" or "xdg-open" on Linux, or
"kde-open" on Kubuntu specifically:

        json -e 'require("packages").order'
            -n
            -e _.contributors
            -A                  # flatten the array
            -w _.url            # if they've got one
            -e _.url            # extract it from their Author object
            -p
        | sort | uniq | xargs open

List the contributors to Narwhal with field selection:

        json -i package.json -j -f contributors -Anp

Use JSONPath to list the contributors:

        json -i package.json -j -$ $.contributors -Anp

Enquote all of the MP3s in your collection, line by line:

        find . -name '*.mp3' | json -nJp

        find . -name '*.mp3' -print0 | json -n0Jp

Rename all of your MP3s so that URL encoded patterns are unescaped:

        find .
            -name '*.mp3'
            -print0             # write null-terminated lines
        | json
            -n                  # line by line
            -z0                 # both read and write null-terminated lines
            -c                  # this forces an array to
                                # be accumulated for reprint
            -p                  # print in escaped form
            -e 'unescape(_)' -p # reprint unescaped
        | xargs
            -0                  # read null-terminated lines
            -n 2                # one command for each adjacent pair
            mv

Convert `/etc/passwd` to JSON:

        json -i /etc/passwd -nd: -NTJp

Convert `/etc/passwd` to JSON with Objects instead of Arrays:

        cat /etc/passwd | json
            -n
            -d:
            -F name,password,uid,gid,class,change,expire,gecos,home,shell
            -x _.uid=+_.uid
            -x _.gid=+_.gid
            -f name,_
            -N
            -O
            -TJp

Create a JSON mapping from user name to UID and format it as CSV:

        cat /etc/passwd | json -nd: -f 0,2 -D, -p

Create a JSON mapping from user name to UID and write it out as a single line of JSON:

        json -i /etc/passwd -nd: -f 0,2 -NOJp

Grab the UID of the "root" user:

        json -i /etc/passwd -nd: -f0,2 -N -O -f root -p

Reverse engineer a package catalog from installed packages:

        json
            -e 'require("packages").order'
            -n # line input mode
            -e '[_.name || _.directory.dirname().basename(), JSON.decode(_.directory.resolve("package.json").read())'
            -N # object input mode
            -O
            -v '{version:1,packages:_}'
            -TJ
            -p

Use the JSON tool as a pointless pipe buffer:

        json -np

Print the number '1' thrice.

        json -e 1 -ppp

Find the largest number from 1 to 10:

        $(which jot) $(which seq) 10 | json -njNe 'Math.max.apply(this, _)' -p

Put all your eggs in one basket:

        json -e 'require("narwhal")' -f LEFT,RIGHT -np

