
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

for (var name in system) {
    if (Object.prototype.hasOwnProperty.call(system, name)) {
        exports[name] = system[name];
    }
}
