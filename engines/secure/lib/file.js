
// -- kriskowal Kris Kowal Copyright 2009-2010 MIT License

for (var name in system.fs) {
    if (Object.prototype.hasOwnProperty.call(system.fs, name))
        exports[name] = system.fs[name];
}

