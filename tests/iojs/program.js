#!/usr/bin/env narwhal

var sandbox = require('sandbox').sandbox;
var fs = require('file');

[
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
].forEach(function (testName) {
    system.print('BEGIN: ' + testName);
    try {
        var prefix = fs.path(require.id).resolve(testName).join('');
        sandbox(
            'program',
            system,
            {
                prefix: prefix,
                debug: true
            }
        );
    } catch (exception) {
        system.print('ERROR ' + (exception.message || exception));
    }
    system.print('END: ' + testName);
    system.print('');
});

