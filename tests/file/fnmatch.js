var assert = require("test/assert");
var fs = require("file");
var util = require("narwhal/util");

var tests = [
    [true,  'cat',          'cat'],
    [false, 'cat',          'category'],
    
    //[false, 'c{at,ub}s',    'cats'],
    //[false, 'c{at,ub}s',    'cubs'],
    [true, 'c{at,ub}s',    'cats'],
    [true, 'c{at,ub}s',    'cubs'],
    [false, 'c{at,ub}s',    'cat'],
    
    [true,  'c?t',          'cat'],
    [false, 'c\\?t',        'cat'],
    [false, 'c??t',         'cat'],
    [true,  'c*',           'cats'],
    [true,  'c/*/t',        'c/a/b/c/t'],
    [true,  'c\at',         'cat'],
    [false, 'c\\at',        'cat', fs.FNM_NOESCAPE],
    
    [true,  'a?b',          'a/b'],
    [false, 'a?b',          'a/b', fs.FNM_PATHNAME],
    
    [false, '*',            '.profile'],
    [false, '.*',           'profile'],
    [true,  '.*',           '.profile'],
    [true,  '*',            '.profile', fs.FNM_PERIOD],
    
    [true,  '*',            'dave/.profile'],
    [true,  '*',            'dave/.profile', fs.FNM_PERIOD],
    [true,  '*',            'dave/profile'],
    [false, '*',            'dave/profile', fs.FNM_PATHNAME],
    [false, '*',            'dave/.profile', fs.FNM_PATHNAME],
    [true,  '*/*',          'dave/profile', fs.FNM_PATHNAME],
    [false, '*/*',          'dave/.profile', fs.FNM_PATHNAME],
    [true,  '*/*',          'dave/.profile', fs.FNM_PATHNAME | fs.FNM_PERIOD],

    [true,  'ca[a-z]',      'cat'],
    [false, '[a-z]',        'D'],
    [true,  '[^a-z]',       'D'],
    [false, '[A-Z]',        'd'],
    [true,  '[^A-Z]',       'd'],
    [true,  '[a-z]',        'D', fs.FNM_CASEFOLD],
    [true,  '[A-Z]',        'd', fs.FNM_CASEFOLD],
    [false, '/ca[s][s-t]/rul[a-b]/[z]he/[x-Z]orld', '/cats/rule/the/World'],
    [true,  '/ca[t][s-t]/rul[a-e]/[t]he/[A-Z]orld', '/cats/rule/the/World'],

    [false, 'cat',          'CAT'],
    [true,  'cat',          'CAT', fs.FNM_CASEFOLD],

    [false, 'ca[!t]',       'cat'],
    [false, 'ca[^t]',       'cat'],

    [false, '?',            '/', fs.FNM_PATHNAME],
    [false, '*',            '/', fs.FNM_PATHNAME],

    [true,  '\\?',          '?'],
    [false, '\\?',          'a'],
    [true,  '\\*',          '*'],
    [false, '\\*',          'a'],
    [true,  '\\a',          'a'],
    [true,  'this\\b',      'thisb'],
    [true,  '\\a',          '\\a', fs.FNM_NOESCAPE],
    [false, '\\a',          'a', fs.FNM_NOESCAPE],
    [false, '\\[foo\\]\\[bar\\]', '[foo][bar]', fs.FNM_NOESCAPE],
    [true,  '\\[foo\\]\\[bar\\]', '[foo][bar]'],
    [true,  '[\\?]',        '?'],
    [true,  '[\\*]',        '*'],

    [false, '**/*.j',       'main.j'],
    [false, '**/*.j',       './main.j'],
    [true,  '**/*.j',       'lib/main.j'],
    [true,  '**.j',         'main.j'],
    [false, '**.j',         './main.j'],
    [true,  '**.j',         'lib/main.j'],
    [true,  '*',            'dave/.profile'],

    [true,  '**/*.j',       'main.j', fs.FNM_PATHNAME],
    [true,  '**/*.j',       'one/two/three/main.j', fs.FNM_PATHNAME],
    [false, '**/*.j',       './main.j', fs.FNM_PATHNAME],

    [true,  '**/*.j',       './main.j', fs.FNM_PATHNAME|fs.FNM_DOTMATCH],
    [true,  '**/*.j',       'one/two/.main.j', fs.FNM_PATHNAME|fs.FNM_DOTMATCH],
    [true,  '**/best/*',    'lib/my/best/song.j'],

    [false, '**/foo',       'a/.b/c/foo', fs.FNM_PATHNAME],
    [true,  '**/foo',       'a/b/c/foo', fs.FNM_PATHNAME],
    [true,  '**/foo',       '/a/b/c/foo', fs.FNM_PATHNAME],
    [true,  '**/foo',       'a/.b/c/foo', fs.FNM_PATHNAME|fs.FNM_PERIOD]
];

tests.forEach(function(test, n) {
    exports["test "+util.repr(test)] = function() {
        assert.eq(test[0], fs.fnmatch.apply(fs, test.slice(1)),
                  "expect '"+test[1]+"' "+(test[0] ? "matches" : "doesn't match" )+" '"+test[2]+"'");
    }
});

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
