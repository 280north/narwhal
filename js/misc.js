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
    
    document.getElementById("releases-list").innerHTML = "<ul>" + reversed.join("\n") + "</ul>";
}
