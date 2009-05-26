var Narcissus = require("narcissus/parse");

var util = require('util');

var PROMPT_NORMAL       = ">>> ",
    PROMPT_INCOMPLETE   = "~~~ "

var buffer = "";
function readln(input) {
    while (!(/\n/).test(buffer))
        buffer += input.read(100).toString();
        
    var lines = buffer.split("\n"),
        line = lines.shift();

    buffer = lines.join("\n");

    return line
}

exports.repl = function() {

    var buffer = "",
        bufferedLines = [],
        pendingLines = [];
        
    system.stdout.write(PROMPT_NORMAL);
    system.stdout.flush();
    
    while (true) {

        // TODO: replace with real readln
        var line = system.stdin.readLine();
        if (!line) {
            system.stdout.write("\n");
            system.stdout.flush();
            break;
        }
        
        line = util.trimEnd(line);
        var text = pendingLines.join("\n") + "\n" + line;
        if (line == "" || !incomplete(text)) {
            
            pendingLines = [];
                
            try {
                var result = system.evalGlobal(text);
                if (!util.no(result)) {
                    system.stdout.write(util.repr(result) + '\n');
                    system.stdout.flush();
                    global._ = result;
                }
            } catch (e) {
                system.stdout.write("    exception from uncaught JavaScript throw: " + e + "\n");
            }
                
        } else
            pendingLines.push(line);
    
        if (pendingLines.length > 0)
            system.stdout.write(PROMPT_INCOMPLETE);
        else
            system.stdout.write(PROMPT_NORMAL);
        system.stdout.flush();

    }
}

function incomplete(text) {
    var incomp = true;
    try {
        var t = new Narcissus.Tokenizer(text);
        var x = new Narcissus.CompilerContext(false);
        var n = Narcissus.Script(t, x);
        incomp = !t.done;
    } catch (e) {
        if (!t.done) {
            print(e);
            return false;
        }
    }
    return incomp;
}

if (require.id == require.main)
    exports.repl();

