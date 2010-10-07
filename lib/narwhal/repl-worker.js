
// -- kriszyp Kris Zyp

var system = require("system");

try { var readline = require("readlineJS").readline; } catch (e) {}
try { var Narcissus = require("narcissus/parse"); } catch (e) {}

var util = require("narwhal/util"),
     queue = require("event-queue");

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
exports.startRepl = function(evaluateAndPrint){
    var buffer = "",
        bufferedLines = [],
        pendingLines = [];
        
    system.stdout.write(PROMPT_NORMAL);
    system.stdout.flush();
    
    while (true) {
        var line = readline ? readline() : system.stdin.readLine();
        if (!line) {
            system.stdout.write("\n");
            system.stdout.flush();
            break;
        }
        
        line = util.trimEnd(line);
        var text = pendingLines.join("\n") + "\n" + line;
        if (line == "" || !incomplete(text)) {
            
            pendingLines = [];
            evaluateAndPrint(text);
        } else
            pendingLines.push(line);
    
        if (pendingLines.length > 0)
            system.stdout.write(PROMPT_INCOMPLETE);
        else
            system.stdout.write(PROMPT_NORMAL);
        system.stdout.flush();

    }
    
}
global.onconnect = function (e) { 
    global.onconnect = null; // only connect to one worker
    exports.startRepl(function(text){
        e.port.postMessage(text);
        queue.processNextEvent(true);// wait for it to be processed before showing the next prompt
        
    });
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




