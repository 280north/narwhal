
var args = require("args");
var parser = exports.parser = new args.Parser();

parser.option('--name', 'name').def("").set();
parser.option('--author', 'author').def("").set();
parser.option('--dependency', 'dependencies').push();
parser.option('--contributor', 'contributors').push();

