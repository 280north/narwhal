exports.repl = function() {

    var buffer = "";    
    system.stdout.write("narwhal> ");

    while (true) {

        // TODO: replace with readln
        buffer += system.stdin.read(20).toString();
        var lines = buffer.split("\n");
        buffer = lines.pop();
    
        while (lines.length > 0)
        {
            var line = lines.shift();
            if (line) {
                try {
                    
                    global._ = system.evalGlobal(line);
                
                    if (global._ !== undefined)
                        system.stdout.write(global._ + "\n");
                
                } catch (e) {
                    system.stdout.write("    exception from uncaught JavaScript throw: " + e + "\n");
                }
            }    

            system.stdout.write("narwhal> ");
        }
    }
}