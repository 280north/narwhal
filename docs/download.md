
Narwhal Downloads
=================

Download a version of Narwhal then follow the [quick start guide](http://narwhaljs.org/quick-start.html) to get running!

Bleeding Edge
-------------

* [Download zip](http://github.com/tlrobinson/narwhal/zipball/master)
* [Download tar](http://github.com/tlrobinson/narwhal/tarball/master)

* Git: `git clone git://github.com/tlrobinson/narwhal.git`

* [View tree](http://github.com/tlrobinson/narwhal/tree/master)
* [View commit](http://github.com/tlrobinson/narwhal/commit/master)


Releases
--------

<div id="releases">Loading...</div>
<script type="text/javascript" charset="utf-8">
    function showreleases(response) {
        var releases = [];
        for (var tag in response.tags) {
            var tar = "http://github.com/tlrobinson/narwhal/tarball/"+tag,
                zip = "http://github.com/tlrobinson/narwhal/zipball/"+tag;
                commit = "http://github.com/tlrobinson/narwhal/commit/"+response.tags[tag],
                tree = "http://github.com/tlrobinson/narwhal/tree/"+response.tags[tag];
            releases.push('<li>'+tag+': [<a href="'+zip+'">zip</a>][<a href="'+tar+'">tar</a>][<a href="'+tree+'">tree</a>][<a href="'+commit+'">commit</a>]</li>');
        }
        releases = releases.sort();
        var reversed = [];
        while (releases.length) reversed.push(releases.pop());
        
        document.getElementById("releases").innerHTML = "<ul>" + reversed.join("\n") + "</ul>";
    }
</script>
<script type="text/javascript" charset="utf-8" src="http://github.com/api/v2/json/repos/show/tlrobinson/narwhal/tags?callback=showreleases"></script>