var Narcissus = null;
try { Narcissus = require("narcissus/parse"); } catch (e) {}

var PROMPT_NORMAL       = "narwhal>> ",
    PROMPT_INCOMPLETE   = "narwhal?> "

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
    
    while (true) {

        // TODO: replace with real readln
        var line = readln(system.stdin);
        
        if (line) {
            
            var text = pendingLines.join("\n") + "\n" + line;
            if (!incomplete(text)) {
                
                pendingLines = [];
                    
                try {
                    global._ = system.evalGlobal(text);
                    if (global._ !== undefined)
                        system.stdout.write(global._ + "\n");
                } catch (e) {
                    system.stdout.write("    exception from uncaught JavaScript throw: " + e + "\n");
                }
                    
            } else
                pendingLines.push(line);
        
            if (pendingLines.length > 0)
                system.stdout.write(PROMPT_INCOMPLETE);
            else
                system.stdout.write(PROMPT_NORMAL);
        }
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
        print(e)
    }
    return incomp;
}
