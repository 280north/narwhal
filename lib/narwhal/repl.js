try {
    var Narcissus = require("narcissus/parse");
} catch(e) {
}

var util = require('util');

var PROMPT_NORMAL       = "js> ",
    PROMPT_INCOMPLETE   = "  > "

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
                var repr = util.repr(result);
                if (repr.length > 76 || /\n/.test(repr))
                    repr = String(result);
                if (!util.no(result)) {
                    system.stdout.write(repr + '\n');
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
    if (!Narcissus)
        return false;

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

if (module.id == require.main)
    exports.repl();

