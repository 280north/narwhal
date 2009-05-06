var test = require('test');
try {
    require('bogus');
    print('FAIL require throws error when module missing', 'fail');
} catch (exception) {
    print('PASS require throws error when module missing', 'pass');
}
print('DONE', 'info');
