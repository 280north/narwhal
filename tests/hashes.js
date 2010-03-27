
var assert = require('assert');
var struct = require('struct');
var util = require('narwhal/util');

var raw = "Hello, World!";
var md4 = require('md4');
var md5 = require('md5');
var sha = require('sha');
var sha256 = require('sha256');
var crc32 = require('crc32');

exports.testMd4 = function () {
    assert.equal(md4.hash("test hash").toString(16), "549089516E75BD13C41FF098FBB58D5E");
    assert.equal(md4.hash("abc").toString(16), "A448017AAF21D8525FC10AE87AA6729D");
};

exports.testMd5 = function () {
    assert.equal(md5.hash(raw).toString(16), "65A8E27D8879283831B664BD8B7F0AD4", 'md5');
    assert.equal(md5.hash("message digest").toString(16), "F96B697D7CB7938D525A2F31AAF161D0");
    assert.equal(md5.hash("abc").toString(16), "900150983CD24FB0D6963F7D28E17F72");
};

exports.testSha = function () {
    assert.equal(sha.hash(raw).toString(16), "0A0A9F2A6772942557AB5355D76AF442F8F65E01", 'sha1');
    assert.equal(sha.hash("160-bit hash").toString(16), "90D925D853C3D35CD54070BB75280FEFAD9DE9E7");
};

exports.testSha256 = function () {
    assert.equal(sha256.hash(raw).toString(16), "DFFD6021BB2BD5B0AF676290809EC3A53191DD81C7F70A4B28688A362182986F", 'sha256');
};

exports.testCrc32 = function () {
    assert.equal(crc32.hash(raw), -(parseInt("EC4AC3D0", 16) + 1) ^ -1, 'crc32');
};

/*
    http://pajhome.org.uk/crypt/md5/
*/

/*

    Original text   Hello, World!
    Original bytes  48:65:6c:6c:6f:2c:20:57:6f:72:6c:64:21 (length=13)
    Adler32 1f9e046a
    CRC32   ec4ac3d0
    Haval   69329e93ccfd832bb1a4ee00d01344cf
    MD2 1c8f1e6a94aaa7145210bf90bb52871a
    MD4 94e3cb0fa9aa7a5ee3db74b79e915989
    MD5 65a8e27d8879283831b664bd8b7f0ad4
    RipeMD128   67f9fe75ca2886dc76ad00f7276bdeba
    RipeMD160   527a6a4b9a6da75607546842e0e00105350b1aaf
    SHA-1   0a0a9f2a6772942557ab5355d76af442f8f65e01
    SHA-256 dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f
    SHA-384 5485cc9b3365b4305dfb4e8337e0a598a574f8242bf17289e0dd6c20a3cd44a089de16ab4ab308f63e44b1170eb5f515
    SHA-512 374d794a95cdcfd8b35993185fef9ba368f160d8daf432d08ba9f1ed1e5abe6cc69291e0fa2fe0006a52570ef18c19def4e617c33ce52ef0a6e5fbe318cb0387
    Tiger   252a5047009cd0710a1aa60525daf73ea55cb90319a39242
    Whirlpool   16c581089b6a6f356ae56e16a63a4c613eecd82a2a894b293f5ee45c37a31d09d7a8b60bfa7e414bd4a7166662cea882b5cf8c96b7d583fc610ad202591bcdb1

    http://www.fileformat.info/tool/hash.htm?text=Hello%2C+World%21

*/

/* test the consistency attribute of each algorithm
 * (always returns the same value for the same input) */

var consistency = function (algorithm, name) {
    return function () {
        // the returned hash should be consistent for the same input.
        var s1 = algorithm.hash("test");
        var s2 = algorithm.hash("test");
        if (s1.decodeToString) {
            assert.equal(
                s1.decodeToString(64),
                s2.decodeToString(64),
                name + "(x) == " + name + "(x)"
            );
        } else {
            assert.equal(s1, s2);
        }
    };
};

util.forEachApply([
    [md4, 'Md4'],
    [md5, 'Md5'],
    [sha, 'Sha'],
    [sha256, 'Sha256'],
    [crc32, 'Crc32']
], function (algorithm, name) {
    exports['testConsistency' + name] = consistency(algorithm, name);
});

if (require.main == module)
    require("os").exit(require("test").run(exports));

