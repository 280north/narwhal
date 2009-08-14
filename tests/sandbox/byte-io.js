
var fs = require('file');
var file = fs.open(fs.resolve(module.path, 'utf-8.js'), 'rb');
var content = file.read();
print(typeof content);
print(content.length);
print('');

var file = fs.open(fs.resolve(module.path, 'utf-8.js'), 'rt', {'charset': 'utf-8'});
var content = file.read();
print(typeof content);
print(content.length);
print('');

var file = fs.open(fs.resolve(module.path, 'utf-8.js'), 'r');
var content = file.read();
print(typeof content);
print(content.length);
print('');

