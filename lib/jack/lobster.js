require("../jack");

Jack.Lobster = function(something) {
};

Jack.Lobster.prototype.invoke = function(env) {
    var req = new Jack.Request(env),
        lobster,
        href;
    
    if (req.GET("flip") === "crash") {
        throw new Error("Lobster crashed");
    }
    else if (req.GET("flip") === "left") {
        lobster = Jack.Lobster.LOBSTER_LEFT;
        href = "?flip=right";
    }
    else {
        lobster = Jack.Lobster.LOBSTER_RIGHT;
        href = "?flip=left";
    }
        
    var res = new Jack.Response();
    
    res.write("<title>Lobstericious!</title>");
    res.write("<pre>");
    res.write(lobster);
    res.write("</pre>");
    res.write("<p><a href='"+href+"'>flip!</a></p>");
    res.write("<p><a href='?flip=crash'>crash!</a></p>");
    
    return res.finish();
}

Jack.Lobster.LOBSTER_RIGHT = "                         ,.---._\n               ,,,,     /       `,\n                \\\\\\\\   /    '\\_  ;\n                 |||| /\\/``-.__\\;'\n                 ::::/\\/_\n {{`-.__.-'(`(^^(^^^(^ 9 `.========='\n{{{{{{ { ( ( (  (   (-----:=\n {{.-'~~'-.(,(,,(,,,(__6_.'=========.\n                 ::::\\/\\\n                 |||| \\/\\  ,-'/,\n                ////   \\ `` _/ ;\n               ''''     \\  `  .'\n                         `---'";
Jack.Lobster.LOBSTER_LEFT = "     _.---.,                             \n   ,`       /     ,,,,                   \n   ;  _\\'    /   \\\\\\\\                    \n   ';\\__.-``/\\/ ||||                     \n            _/\\/::::                     \n'=========.` 9 ^(^^^(^^(`('-.__.-`{{     \n         =:-----(   (  ( ( ( { {{{{{{    \n.========='._6__(,,,(,,(,(.-'~~'-.{{     \n             \\/\\::::                     \n     ,/'-,  \\/\\ ||||                     \n     ; /_ `` \\   ////                    \n     '.  `  \\     ''''                   \n       '---`";
