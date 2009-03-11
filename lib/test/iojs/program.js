
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
    'transitive',
    'determinism'
], function (testName) {
    base.print('BEGIN: ' + testName);
    try {
        sandbox(
            'program',
            environment,
            {
                prefix: 'test/iojs/' + testName + '/',
                debug: true
            }
        );
    } catch (exception) {
        base.print('ERROR ' + (exception.message || exception));
    }
    base.print('END: ' + testName);
    base.print('');
});

