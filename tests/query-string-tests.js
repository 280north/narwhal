var QueryString = require("querystring");
exports.testUnescape = function() {
    assert.isEqual("fo<o>bar", QueryString.unescape("fo%3Co%3Ebar"));
    assert.isEqual("a space", QueryString.unescape("a%20space"));
    assert.isEqual("a+space", QueryString.unescape("a+space"));
    assert.isEqual("a+space", QueryString.unescape("a+space", false));
    assert.isEqual("a space", QueryString.unescape("a+space", true));
    assert.isEqual("q1!2\"'w$5&7/z8)?\\", QueryString.unescape("q1%212%22%27w%245%267%2Fz8%29%3F%5C"));
}

// [ wonkyQS, canonicalQS, obj ]
var qsTestCases = [
    ["foo=bar",  "foo=bar", {"foo" : "bar"}],
    ["foo=bar&foo=quux", "foo%5B%5D=bar&foo%5B%5D=quux", {"foo" : ["bar", "quux"]}],
    ["foo=1&bar=2", "foo=1&bar=2", {"foo" : 1, "bar" : 2}],
    ["my+weird+field=q1%212%22%27w%245%267%2Fz8%29%3F", "my%20weird%20field=q1!2%22'w%245%267%2Fz8)%3F", {"my weird field" : "q1!2\"'w$5&7/z8)?" }],
    ["foo%3Dbaz=bar", "foo%3Dbaz=bar", {"foo=baz" : "bar"}],
    ["foo=baz=bar", "foo=baz%3Dbar", {"foo" : "baz=bar"}],
    ["str=foo&arr[]=1&arr[]=2&arr[]=3&obj[a]=bar&obj[b][]=4&obj[b][]=5&obj[b][]=6&obj[b][]=&obj[c][]=4&obj[c][]=5&obj[c][][somestr]=baz&obj[objobj][objobjstr]=blerg&somenull=&undef=", "str=foo&arr%5B%5D=1&arr%5B%5D=2&arr%5B%5D=3&obj%5Ba%5D=bar&obj%5Bb%5D%5B%5D=4&obj%5Bb%5D%5B%5D=5&obj%5Bb%5D%5B%5D=6&obj%5Bb%5D%5B%5D=&obj%5Bc%5D%5B%5D=4&obj%5Bc%5D%5B%5D=5&obj%5Bc%5D%5B%5D%5Bsomestr%5D=baz&obj%5Bobjobj%5D%5Bobjobjstr%5D=blerg&somenull=&undef=", {
        "str":"foo",
        "arr":[1,2,3],
        "obj":{
            "a":"bar",
            "b":[4,5,6,""],
            "c":[4,5,{"somestr":"baz"}],
            "objobj":{"objobjstr":"blerg"}
        },
        "somenull":"",
        "undef":""
    }],
    ["foo[bar][bla]=baz&foo[bar][bla]=blo", "foo%5Bbar%5D%5Bbla%5D%5B%5D=baz&foo%5Bbar%5D%5Bbla%5D%5B%5D=blo", {"foo":{"bar":{"bla":["baz","blo"]}}}],
    ["foo[bar][][bla]=baz&foo[bar][][bla]=blo", "foo%5Bbar%5D%5B%5D%5Bbla%5D=baz&foo%5Bbar%5D%5B%5D%5Bbla%5D=blo", {"foo":{"bar":[{"bla":"baz"},{"bla":"blo"}]}}],
    ["foo[bar][bla][]=baz&foo[bar][bla][]=blo", "foo%5Bbar%5D%5Bbla%5D%5B%5D=baz&foo%5Bbar%5D%5Bbla%5D%5B%5D=blo", {"foo":{"bar":{"bla":["baz","blo"]}}}],
    [" foo = bar ", "foo=bar", {"foo":"bar"}]
];
var qsColonTestCases = [
    ["foo:bar", "foo:bar", {"foo":"bar"}],
    ["foo:bar;foo:quux", "foo%5B%5D:bar;foo%5B%5D:quux", {"foo" : ["bar", "quux"]}],
    ["foo:1&bar:2;baz:quux", "foo:1%26bar%3A2;baz:quux", {"foo":"1&bar:2", "baz":"quux"}],
    ["foo%3Abaz:bar", "foo%3Abaz:bar", {"foo:baz":"bar"}],
    ["foo:baz:bar", "foo:baz%3Abar", {"foo":"baz:bar"}]
];
exports.testParseQuery = function() {
    qsTestCases.forEach(function (testCase) {
        assert.isSame(testCase[2], QueryString.parseQuery(testCase[0]));
    });
    qsColonTestCases.forEach(function (testCase) {
        assert.isSame(testCase[2], QueryString.parseQuery(testCase[0], ";", ":"))
    });
}
exports.testToQueryString = function () {
    qsTestCases.forEach(function (testCase) {
        assert.isSame(testCase[1], QueryString.toQueryString(testCase[2]));
    });
    qsColonTestCases.forEach(function (testCase) {
        assert.isSame(testCase[1], QueryString.toQueryString(testCase[2], ";", ":"));
    });
};
