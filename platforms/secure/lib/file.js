
for (var name in system.fs) {
    if (Object.prototype.hasOwnProperty.call(system.fs, name))
        exports[name] = system.fs[name];
}

