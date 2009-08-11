#!/usr/bin/env narwhal

var assert = require('test/assert');
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
    exports['test ' + testName] = function () {
        var prefix = fs.path(module.id).resolve(testName).join('');
        var done;

        var print = function (message) {
            assert.isFalse(/^FAIL/.test(message));
            if (/^ERROR/.test(message))
                throw new Error(message);
            if (/^DONE/.test(message))
                done = true;
        };

        sandbox(
            'program',
            system,
            {
                prefix: prefix,
                loader: require.loader,
                print: print
            }
        );
        assert.isTrue(done, 'done');
    };
});

if (module.id == require.main)
    require('os').exit(require('test/runner').run(exports));

