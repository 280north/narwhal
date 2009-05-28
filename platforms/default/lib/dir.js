// Dir: default

var Dir = exports;

Dir.pwd = function() {
    if (system.env["PWD"] === undefined)
        throw new Error("Couldn't get pwd");
    return system.env["PWD"];
}
