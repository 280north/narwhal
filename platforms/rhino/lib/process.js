var Process = exports.Process = {};

Process.exec = function(cmd) {
    return java.lang.Runtime.getRuntime().exec(cmd);
}