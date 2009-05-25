
var fs = require('file');

exports.createCatalog = function (options) {
    var tuskDirectory = fs.path(system.packagePrefixes[0]).join('.tusk');
    tuskDirectory.mkdirs();

    options.acted = true;
    var http = require('http');
    var json = require('json');
    var catalog = {};
    options.args.forEach(function (project) {
        var location = "http://github.com/" + project + "/raw/master/package.json";
        var text = http.read(location).toString('utf-8');
        var projectData = json.decode(text);
        projectData.githubName = project;
        projectData.location = location;
        name = projectData.name || project.split('/').pop();
        catalog[name] = projectData;
    });
    tuskDirectory.join('catalog.json').write(json.encode(catalog, null, 4));
};

var args = require("args");
var parser = exports.parser = new args.Parser({
    help: 'A Narwhal project package manager.',
    options: [
        {
            _:'i',
            __:'install',
            name: 'package',
            help: 'not yet implemented',
            action: function (options, name, value) {
                options.acted = true;
            }
        },
        {
            _:'c',
            __:'clone',
            name: 'package',
            help: 'not yet implemented',
            action: function (options, name, value) {
                options.acted = true;
            }
        },
        {
            _:'r',
            __:'remove',
            help: 'not yet implemented',
            hidden: true,
            action: function (options, name, value) {
                options.acted = true;
            }
        },
        {
            _:'u',
            __:'upgrade',
            help: 'not yet implemented',
            action: function (options, name, value) {
                options.acted = true;
            }
        },
        {
            _:'u',
            __:'update',
            help: 'not yet implemented',
            action: function (options, name) {
                options.acted = true;
            }
        },
        {
            _:'s',
            __:'search',
            name: 'keywords',
            help: 'not yet implemented',
            hidden:true,
            action: function (options, name) {
                options.acted = true;
            }
        },
        {
            __:'create-github-catalog',
            help: 'creates a catalog of packages from the named github projects',
            action: exports.createCatalog
        },
        {
            _:'h',
            __:'help',
            help: 'prints this help message',
            action: "printHelp"
        }
    ]
});

if (require.id == require.main) {
    var options = parser.parse(system.args);
    if (!options.acted)
        parser.printHelp(options);
}

