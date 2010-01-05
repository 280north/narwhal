
var ASSERT = require("assert");
var ARGS = require("../args");

exports.testChoicesArray = function () {

    var parser = new ARGS.Parser();

    parser.option('--bundle-type', 'bundleType')
        .help("type of bundle to be built")
        .def('xo')
        .choices(['xo', 'web'])
        .set();

    parser.parse(['command', '--bundle-type', 'xo']);

};

if (require.main == module.id)
    require("os").exit(require("test").run(exports));

