var OS = require("os");
var ASSERT = require("assert");
var UTIL = require("UTIL");
var stream = require("term").stream;

// config
var random = false;
var maxLength = 10;
var tokens = ["x", "'", '"', " ", "\\"];

function shellParse(argString) {
    // print(argString)
    var p = OS.popen(["sh", "-c", 'for i in "$@"; do echo "$i"; done', "--"].map(OS.enquote).join(" ") + " " + argString);
    var x = p.stdout.read();
    // print("["+x+"]")
    var result = x.split("\n").slice(0,-1);
    if (p.wait())
        throw result;
    return result;
}

var testIndex = -1;
function buildTestString() {
    
    if (random) {
        var components = [];
        var n = Math.round(Math.random()*maxLength);
        while (components.length < n)
            components.push(tokens[Math.floor(Math.random()*tokens.length)]);
        return components.join("");
    }
    else {
        var index = testIndex++;
        if (index < 0)
            return "";
        // convert to a base tokens.length number and replace each digit with corresponding token
        return index.toString(tokens.length).replace(/./g, function(x) {
            return tokens[parseInt(x, tokens.length)];
        });
    }
}

while (true) {
    var argString = buildTestString();

    try {
        var expectedArgs = shellParse(argString);
    } catch (e) {
        // TODO: test invalid behavior matches?
        continue;
    }
    
    var actualArgs = OS.parse(argString);
    
    var pass = UTIL.eq(expectedArgs, actualArgs);
    
    stream.print("[" + testIndex + "] " + (pass ? "\0green(PASS\0)" : "\0red(FAIL\0)") +
        ": string=["+argString+"] expected=["+expectedArgs+"]("+expectedArgs.length+") actual=["+actualArgs+"]("+actualArgs.length+")");
}
