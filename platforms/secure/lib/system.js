
for (var name in system) {
    if (Object.prototype.hasOwnProperty.call(system, name)) {
        exports[name] = system[name];
    }
}
