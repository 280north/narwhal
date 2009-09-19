
var assert = require("test/assert");
var file = require("file");
var util = require("util");

util.forEachApply([
    ["", "", true],
    ["a", "a", true],
    ["?", "a", true],
    ["?", "b", true],
    ["?", "", false],
    ["?", "ab", false],
    ["??", "ab", true],
    ["*", "", true],
    ["*", "a", true],
    ["*", "ab", true],
    ["*.js", "ab", false],
    ["*.js", "ab.js", true],
    ["?git*", ".git", true],
    ["?git*", ".gitignore", true],
    ["*", "a/b", false],
    ["/*", "", false],
    ["/**", "", true],
    ["[ab]", "a", true],
    ["[ab]", "b", true],
    ["[ab]", "c", false],
    ["*.c{,pp,xx}", "a.c", true],
    ["*.c{,pp,xx}", "a.cpp", true],
    ["*.c{,pp,xx}", "a.cxx", true],
    ["*.c{,pp,xx}", "a.h", false],
    // ["a{b{c}}", "abc", true], // needs to go context free
    // ["a{/b/{c}}", "a/b/c", true],
    ["/a", "a", false],
    ["/a", "/a", true],
    ["...", ".", true],
    [".../a", "./a", true],
    [".../a", "../a", true],
    [".../a", "../../a", true],
    ["[*]", "*", true],
    [".", "*", false],
    ["?", "*", true],
    ["$", "$", true],
    ["^", "^", true],
    [".", ".", true],
    ["/**/d.js", "/a/b/c/d.js", true],
    ["/b/**/d.js", "/a/b/c/d.js", false],
    ["/a/**/b.js", "/a/b.js", true],
    ["/**/...", "/", true],

    // need ellipsis support for absolute paths ,
    //   and ** interactions

    // ["/a/b/c/...", "/a/b/c/", true],
    // ["/a/b/c/...", "/a/b/", true],
    // ["/a/b/c/...", "/a/", true],
    // ["/a/b/c/...", "/", true],
    // ["a/b/c/...", "../..", true],
    // ["a/b/c/...", "a/b/c", true],
    // ["a/b/c/...", "a/b/c/d", false],

    // ["/prefix/**/postfix", "/prefix/a/postfix", true],
    // ["/prefix/**/postfix", "/prefix/postfix", true],
    // ["/prefix/**/postfix", "/prefix/a", false],
    // ["/prefix/**/postfix", "/postfix", false],

    // ["/prefix/.../postfix", "/prefix/postfix", true],
    // ["/prefix/.../postfix", "/postfix", true],
    // ["/prefix/.../postfix", "/prefix/a/postfix", false],
    // ["/prefix/.../postfix", "/", false],

    // ["/pre/**/in/.../post", "/pre/in/no/post", true],
    // ["/pre/**/in/.../post", "/pre/in/post", true],
    // ["/pre/**/in/.../post", "/pre/no/post", true],
    // ["/pre/**/in/.../post", "/pre/post", true],
    // ["/pre/**/in/.../post", "/post", true],

    // ["/pre/**/in/.../post", "/pre/in/no", false],
    // ["/pre/**/in/.../post", "/pre", false],
    // ["/pre/**/in/.../post", "/no/post", false],
    // ["/pre/**/in/.../post", "/", false],

    // ["/pre/.../in/**/post", "/pre/in/post", true],
    // ["/pre/.../in/**/post", "/pre/in/no/post", true],
    // ["/pre/.../in/**/post", "/in/post", true],
    // ["/pre/.../in/**/post", "/in/no/post", true],

    // ["/pre/.../in/**/post", "/post", false],
    // ["/pre/.../in/**/post", "/no/in/post", false],
    // ["/pre/.../in/**/post", "/pre/in/no", false],
    // ["/pre/.../in/**/post", "/in/no", false]

], function (pattern, path, expected) {
    exports['test ' + util.repr(arguments)] = function () {
        //if (file.match(path, pattern) != expected)
        //    print('pattern: ' + util.repr(file.pattern));
        assert.eq(expected, file.match(path, pattern));
    };
});

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

