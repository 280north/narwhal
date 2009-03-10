
var base = require('chiron/base');
var sandbox = require('chiron/sandbox').sandbox;

base.forEach([
    'absolute',
    'cyclic',
    'exactExports',
    'hasOwnProperty',
    'method',
    'missing',
    'monkeys',
    'nested',
    'relative',
    'transitive'
], function (testName) {
    base.print('BEGIN: ' + testName);
    sandbox(
        'program',
        environment,
        {
            prefix: 'test/iojs/' + testName + '/',
            debug: true
        }
    );
    base.print('END: ' + testName);
    base.print('');
});

