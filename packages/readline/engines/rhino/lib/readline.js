
var reader = new Packages.jline.ConsoleReader();

exports.readline = function() {
    return String(reader.readLine());
}
