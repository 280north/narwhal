
var fs = require("file");
var json = require("json");
var util = require("util");
var args = require("args");
var parser = exports.parser = new args.Parser();

parser.help('initializes a Narwhal package/project directory');

parser.option('--name', 'name').def("").set();
parser.option('--author', 'author').def("").set();
parser.option('--dependency', 'dependencies').push();
parser.option('--contributor', 'contributors').push();

parser.action(function (options, parentOptions) {
    parentOptions.acted = true;
    var packageInfo = {};
    var path;
    if (options.args.length && !/^-/.test(options.args[0]))
        path = options.args.shift();
    else
        path = fs.cwd();
    util.update(packageInfo, options);
    delete packageInfo.args;
    delete packageInfo.command;
    path = fs.path(path).absolute();
    print(path);
    path.join('.tusk').mkdirs();
    path.join('bin').mkdirs();
    path.join('lib').mkdirs();
    system.platforms.forEach(function (platform) {
        platform = path.join('platforms', platform);
        platform.join('lib').mkdirs();
    });
    path.join('packages').mkdirs();

    var sea = path.join('bin', 'sea');
    fs.path(system.prefix).join('bin', 'sea').copy(sea);
    sea.chmod(0755);

    var activate = path.join('bin', 'activate.bash');
    fs.path(system.prefix).join('bin', 'activate.bash')
        .copy(activate);
    activate.relative().symlink(activate.resolve('activate'));

    path.join('README').touch();
    path.join('narwhal.conf')
        .write('NARWHAL_DEFAULT_PLATFORM=' + system.platform);
    var packagePath = path.join('package.json');
    if (packagePath.isFile())
        util.complete(
            packageInfo, 
            json.decode(packagePath.read({charset:'utf-8'}))
        );
    packagePath.write(
        json.encode(packageInfo, null, 4),
        {charset:'utf-8'}
    );
});

