// -- cadorn Christoph Dorn
exports.exit = function(status) {
    throw new Error("Exiting with status="+status);
}
